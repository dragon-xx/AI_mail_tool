const Imap = require('imap');
const { getImapConfig, handleImapError } = require('./utils/imapConfig');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: '只支持GET请求' })
    };
  }

  // 从请求头中获取登录状态
  const loginState = event.headers['x-login-state'];
  if (!loginState) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: '未登录' })
    };
  }

  try {
    const { email, password } = JSON.parse(loginState);
    if (!email || !password) {
      console.log(`[收件箱] 获取邮件失败 - 原因: 邮箱或密码为空`);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: '邮箱和密码不能为空' })
      };
    }

    const imapConfig = getImapConfig(email, password);

    if (!imapConfig.host) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: '不支持的邮箱服务商' })
      };
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

          // 获取最近的10封邮件
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

    return {
      statusCode: 200,
      body: JSON.stringify(messages)
    };
  } catch (error) {
    console.log('[收件箱] 获取邮件异常：', error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || '获取邮件列表失败，请稍后重试';

    return {
      statusCode,
      body: JSON.stringify({ message: errorMessage })
    };
  }
};
