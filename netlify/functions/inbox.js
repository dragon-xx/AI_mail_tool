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
        let errorMessage = '获取邮件列表失败';
        let statusCode = 500;

        // 密码错误相关错误
        if (err.message.includes('Invalid login') || 
            err.message.includes('AUTHENTICATIONFAILED') || 
            err.message.includes('Invalid credentials') || 
            err.message.includes('LOGIN failed')) {
          errorMessage = '邮箱或密码错误';
          statusCode = 401;
        }
        // 网络连接相关错误
        else if (err.message.includes('ENOTFOUND')) {
          errorMessage = '无法连接到邮件服务器，请检查网络连接';
          statusCode = 503;
        } else if (err.message.includes('ETIMEDOUT') || err.message.includes('Connection timed out')) {
          errorMessage = '连接邮件服务器超时，请稍后重试';
          statusCode = 504;
        }
        // SSL/TLS相关错误
        else if (err.message.includes('certificate') || err.message.includes('SSL')) {
          errorMessage = '服务器安全连接失败，请检查邮箱设置';
          statusCode = 502;
        }
        // 服务器拒绝相关错误
        else if (err.message.includes('Connection refused') || err.message.includes('ECONNREFUSED')) {
          errorMessage = '邮件服务器拒绝连接，请稍后重试';
          statusCode = 503;
        }

        const error = new Error(errorMessage);
        error.statusCode = statusCode;
        reject(error);
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
