const express = require('express');
const Imap = require('imap');
const { getImapConfig, handleImapError } = require('../../netlify/functions/utils/imapConfig');

const router = express.Router();

// 登录接口
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[认证] 收到登录请求 - 邮箱: ${email}`);

  if (!email || !password) {
    console.log(`[认证] 登录失败 - 邮箱: ${email}, 原因: 邮箱或密码为空`);
    return res.status(400).json({ message: '邮箱和密码不能为空' });
  }

  const imapConfig = getImapConfig(email, password);
  if (!imapConfig.host) {
    console.log(`[认证] 登录失败 - 邮箱: ${email}, 原因: 不支持的邮箱服务商`);
    return res.status(400).json({ message: '暂不支持该邮箱服务商' });
  }

  try {
    await new Promise((resolve, reject) => {
      const imap = new Imap(imapConfig);

      imap.once('ready', () => {
        console.log(`[认证] 登录成功 - 邮箱: ${email}`);
        imap.end();
        resolve();
      });

      imap.once('error', (err) => {
        console.log(`[认证] 登录失败 - 邮箱: ${email}, 原因:`, err.message);
        reject(handleImapError(err));
      });

      imap.connect();
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[认证] 登录异常：', error);
    res.status(error.statusCode || 500).json({ message: error.message || '登录失败，请稍后重试' });
  }
});

// 收件箱接口
router.get('/inbox', async (req, res) => {
  const loginState = req.headers['x-login-state'];
  if (!loginState) {
    return res.status(401).json({ message: '未登录' });
  }

  try {
    const { email, password } = JSON.parse(loginState);
    if (!email || !password) {
      console.log(`[收件箱] 获取邮件失败 - 原因: 邮箱或密码为空`);
      return res.status(400).json({ message: '邮箱和密码不能为空' });
    }

    const imapConfig = getImapConfig(email, password);
    if (!imapConfig.host) {
      return res.status(400).json({ message: '不支持的邮箱服务商' });
    }

    const messages = await new Promise((resolve, reject) => {
      const imap = new Imap(imapConfig);
      const mailList = [];

      console.log(`[收件箱] 开始获取邮件 - 邮箱: ${email}`);
      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            imap.end();
            reject(err);
            return;
          }

          const fetch = imap.seq.fetch('1:10', {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
            struct: true
          });

          fetch.on('message', (msg, seqno) => {
            const email = {
              id: seqno,
              from: '',
              to: '',
              subject: '',
              date: ''
            };

            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', () => {
                const header = Imap.parseHeader(buffer);
                email.from = header.from ? header.from[0] : '';
                email.to = header.to ? header.to[0] : '';
                email.subject = header.subject ? header.subject[0] : '';
                email.date = header.date ? header.date[0] : '';
              });
            });

            msg.once('end', () => {
              mailList.push(email);
            });
          });

          fetch.once('error', (err) => {
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            imap.end();
            resolve(mailList);
          });
        });
      });

      imap.once('error', (err) => {
        console.log(`[收件箱] 获取邮件失败 - 邮箱: ${email}, 原因:`, err.message);
        reject(handleImapError(err));
      });

      imap.connect();
    });

    res.json(messages);
  } catch (error) {
    console.log('[收件箱] 获取邮件异常：', error);
    res.status(error.statusCode || 500).json({ message: error.message || '获取邮件列表失败，请稍后重试' });
  }
});

module.exports = router;
