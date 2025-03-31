const Imap = require('imap');
const { getImapConfig, handleImapError } = require('./utils/imapConfig');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: '只支持POST请求' })
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);
    console.log(`[认证] 收到登录请求 - 邮箱: ${email}`);

    if (!email || !password) {
      console.log(`[认证] 登录失败 - 邮箱: ${email}, 原因: 邮箱或密码为空`);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: '邮箱和密码不能为空' })
      };
    }

    const imapConfig = getImapConfig(email, password);
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
        reject(handleImapError(err));
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
