const Imap = require('imap');

const getImapConfig = (email, password) => {
  const config = {
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

  return config;
};

const handleImapError = (err) => {
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
  return error;
};

module.exports = {
  getImapConfig,
  handleImapError
};
