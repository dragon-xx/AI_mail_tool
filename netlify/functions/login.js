const Imap = require('imap');

exports.handler = async function(event, context) {
  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: '只支持POST请求' })
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);
    console.log(`[认证] 收到登录请求 - 邮箱: ${email}`);

    // 验证必填字段
    if (!email || !password) {
      console.log(`[认证] 登录失败 - 邮箱: ${email}, 原因: 邮箱或密码为空`);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: '邮箱和密码不能为空' })
      };
    }

    // 尝试连接IMAP服务器
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
      console.log(`[认证] 登录失败 - 邮箱: ${email}, 原因: 不支持的邮箱服务商`);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: '暂不支持该邮箱服务商' })
      };
    }

    await new Promise((resolve, reject) => {
      const imap = new Imap(imapConfig);

      imap.once('ready', () => {
        console.log(`[认证] 登录成功 - 邮箱: ${email}`);
        imap.end();
        resolve();
      });

      imap.once('error', (err) => {
        console.log(`[认证] 登录失败 - 邮箱: ${email}, 原因:`, err.message);
        // 格式化IMAP错误信息
        let errorMessage = '连接邮件服务器失败';
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
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('[认证] 登录异常：', error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || '登录失败，请稍后重试';

    return {
      statusCode,
      body: JSON.stringify({ message: errorMessage })
    };
  }
};
