const Imap = require('imap');

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
      return {
        statusCode: 401,
        body: JSON.stringify({ message: '登录信息无效' })
      };
    }

    const imapConfig = {
      user: email,
      password: password,
      host: email.includes('@gmail.com') ? 'imap.gmail.com' : 
            email.includes('@outlook.com') ? 'outlook.office365.com' : 
            email.includes('@qq.com') ? 'imap.qq.com' : 
            email.includes('@163.com') ? 'imap.163.com' : 
            email.includes('@pku.edu.cn') ? 'mail.pku.edu.cn' : '',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };

    if (!imapConfig.host) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: '不支持的邮箱服务商' })
      };
    }

    const messages = await new Promise((resolve, reject) => {
      const imap = new Imap(imapConfig);
      const mailList = [];

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
        reject({
          statusCode: 500,
          message: '获取邮件列表失败：' + err.message
        });
      });

      imap.connect();
    });

    return {
      statusCode: 200,
      body: JSON.stringify(messages)
    };
  } catch (error) {
    console.error('获取收件箱异常：', error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || '获取收件箱失败，请稍后重试';

    return {
      statusCode,
      body: JSON.stringify({ message: errorMessage })
    };
  }
};
