import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// 静态文件服务
app.use(express.static(join(__dirname, 'dist')));

// API路由处理
app.use('/api', (req, res, next) => {
  // 验证API请求的内容类型和格式
  res.setHeader('Content-Type', 'application/json');
  next();
});

import { simpleParser } from 'mailparser';
import { promisify } from 'util';

// 邮件缓存
const emailCache = new Map();

// 收件箱API
app.get('/api/inbox', async (req, res) => {
  const startTime = Date.now();
  console.log(`[收件箱] 开始处理请求 - 时间: ${new Date().toISOString()}`);
  
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    console.log(`[收件箱] 请求参数 - 页码: ${page}, 每页数量: ${pageSize}`);
    
    // 从localStorage获取登录信息
    const loginInfo = req.headers['x-login-state'] ? JSON.parse(req.headers['x-login-state']) : null;
    
    if (!loginInfo || !loginInfo.email || !loginInfo.password) {
      console.log(`[收件箱] 认证失败 - 未提供有效的登录信息`);
      return res.status(401).json({ error: '未登录或登录信息不完整' });
    }
    
    console.log(`[收件箱] 用户认证成功 - 邮箱: ${loginInfo.email}`)
    
    // 检查缓存
    const cacheKey = `${loginInfo.email}_inbox`;
    let messages = [];
    let total = 0;
    
    // 如果缓存存在且未过期（10分钟内有效）
    const cachedData = emailCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < 10 * 60 * 1000) {
      console.log(`[收件箱] 使用缓存数据 - 邮箱: ${loginInfo.email}`);
      messages = cachedData.messages;
      total = cachedData.total;
    } else {
      // 配置IMAP连接
      const imapConfig = {
        user: loginInfo.email,
        password: loginInfo.password,
        host: loginInfo.email.includes('@gmail.com') ? 'imap.gmail.com' : 
              loginInfo.email.includes('@outlook.com') ? 'outlook.office365.com' : 
              loginInfo.email.includes('@qq.com') ? 'imap.qq.com' : 
              loginInfo.email.includes('@163.com') ? 'imap.163.com' : 
              loginInfo.email.includes('@pku.edu.cn') ? 'mail.pku.edu.cn' : '',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      };
      
      if (!imapConfig.host) {
        return res.status(400).json({ error: '暂不支持该邮箱服务商' });
      }
      
      // 连接IMAP服务器并获取邮件
      console.log(`[收件箱] 开始连接IMAP服务器 - 主机: ${imapConfig.host}, 用户: ${imapConfig.user}`);
      const imapStartTime = Date.now();
      const imap = new Imap(imapConfig);
      
      // 将回调函数转换为Promise
      const openBox = promisify(imap.openBox.bind(imap));
      
      await new Promise((resolve, reject) => {
        imap.once('ready', async () => {
          console.log(`[收件箱] IMAP服务器连接成功 - 耗时: ${Date.now() - imapStartTime}ms`);
          try {
            // 打开收件箱
            const boxStartTime = Date.now();
            await openBox('INBOX', true);
            console.log(`[收件箱] 打开收件箱成功 - 耗时: ${Date.now() - boxStartTime}ms`);
            
            // 搜索邮件（默认获取最近50封）
            const searchStartTime = Date.now();
            console.log(`[收件箱] 开始搜索邮件...`);
            imap.search(['ALL'], async (err, results) => {
              if (err) {
                console.log(`[收件箱] 搜索邮件失败 - 错误: ${err.message}`);
                imap.end();
                return reject(err);
              }
              
              console.log(`[收件箱] 搜索邮件完成 - 耗时: ${Date.now() - searchStartTime}ms, 找到邮件数: ${results ? results.length : 0}`);
              
              if (!results || results.length === 0) {
                console.log(`[收件箱] 未找到任何邮件`);
                imap.end();
                messages = [];
                total = 0;
                resolve();
                return;
              }
              
              // 按日期排序（最新的在前）
              results.sort((a, b) => b - a);
              
              // 获取所有邮件
              const fetchStartTime = Date.now();
              console.log(`[收件箱] 开始获取邮件内容...`);
              const fetch = imap.fetch(results, { bodies: '' });
              const fetchedMessages = [];
              let processedCount = 0;
              
              fetch.on('message', (msg) => {
                const msgStartTime = Date.now();
                console.log(`[收件箱] 开始处理邮件 #${processedCount + 1}`);
                
                msg.on('body', (stream) => {
                  let buffer = '';
                  
                  stream.on('data', (chunk) => {
                    buffer += chunk.toString('utf8');
                  });
                  
                  stream.once('end', async () => {
                    try {
                      // 解析邮件内容
                      const parseStartTime = Date.now();
                      const parsed = await simpleParser(buffer);
                      console.log(`[收件箱] 邮件 #${processedCount + 1} 解析完成 - 耗时: ${Date.now() - parseStartTime}ms`);
                      
                      fetchedMessages.push({
                        id: parsed.messageId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
                        subject: [parsed.subject || '(无主题)'],
                        from: [parsed.from?.text || '未知发件人'],
                        date: [parsed.date?.toISOString() || new Date().toISOString()]
                      });
                      processedCount++;
                      console.log(`[收件箱] 邮件 #${processedCount} 处理完成 - 总耗时: ${Date.now() - msgStartTime}ms`);
                    } catch (parseError) {
                      console.error('[收件箱] 解析邮件失败:', parseError);
                      processedCount++;
                    }
                  });
                });
              });
              
              fetch.once('error', (err) => {
                imap.end();
                reject(err);
              });
              
              fetch.once('end', () => {
                console.log(`[收件箱] 所有邮件获取完成 - 总耗时: ${Date.now() - fetchStartTime}ms, 总邮件数: ${fetchedMessages.length}`);
                imap.end();
                messages = fetchedMessages;
                total = fetchedMessages.length;
                
                // 更新缓存
                emailCache.set(cacheKey, {
                  messages: fetchedMessages,
                  total: fetchedMessages.length,
                  timestamp: Date.now()
                });
                console.log(`[收件箱] 邮件缓存已更新 - 邮箱: ${loginInfo.email}`);
                
                resolve();
              });
            });
          } catch (error) {
            imap.end();
            reject(error);
          }
        });
        
        imap.once('error', (err) => {
          console.error(`[收件箱] IMAP连接错误 - 邮箱: ${loginInfo.email}, 错误: ${err.message}`);
          reject(err);
        });
        
        // 设置连接超时处理
        const connectionTimeout = setTimeout(() => {
          console.error(`[收件箱] IMAP连接超时 - 邮箱: ${loginInfo.email}, 主机: ${imapConfig.host}`);
          imap.end();
          reject(new Error('IMAP服务器连接超时，请稍后重试'));
        }, 30000); // 30秒超时
        
        imap.once('ready', () => {
          clearTimeout(connectionTimeout); // 连接成功后清除超时计时器
        });
        
        console.log(`[收件箱] 开始连接IMAP服务器...`);
        imap.connect();
      });
    }
    
    // 分页处理
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedMessages = messages.slice(startIndex, endIndex);
    
    res.json({
      messages: paginatedMessages,
      total: total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('[收件箱] 获取邮件失败:', error);
    res.status(500).json({ error: '获取邮件失败', message: error.message });
  }
});

import Imap from 'imap';

// 登录路由
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[认证] 收到登录请求 - 邮箱: ${email}`);

    // 验证必填字段
    if (!email || !password) {
      console.log(`[认证] 登录失败 - 邮箱: ${email}, 原因: 邮箱或密码为空`);
      return res.status(400).json({ message: '邮箱和密码不能为空' });
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
      return res.status(400).json({ message: '暂不支持该邮箱服务商' });
    }

    const imap = new Imap(imapConfig);

    await new Promise((resolve, reject) => {
      imap.once('ready', () => {
        console.log(`[认证] 登录成功 - 邮箱: ${email}`);
        imap.end();
        resolve();
      });

      imap.once('error', (err) => {
        console.log(`[认证] 登录失败 - 邮箱: ${email}, 原因:`, err.message);
        reject(err);
      });

      imap.connect();
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('[认证] 登录异常：', error);
    let statusCode = 500;
    if (error.message.includes('Invalid credentials') || error.message.includes('Invalid login') || error.message.includes('LOGIN Login error or password error')) {
      statusCode = 401;
    } else if (error.message.includes('Connection timed out')) {
      statusCode = 504;
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      statusCode = 503;
    }

    res.status(statusCode).json({ message: error.message });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('[错误处理]', err.stack);
  
  // 确保设置正确的Content-Type
  res.setHeader('Content-Type', 'application/json');
  
  // 标准化错误状态码和消息
  const statusCode = err.status || err.statusCode || 500;
  const errorMessage = err.message || '服务器内部错误';
  
  // 构建基础错误响应对象
  const baseErrorResponse = {
    error: true,
    message: errorMessage,
    status: statusCode,
    timestamp: new Date().toISOString(),
    path: req.path
  };
  
  // 在开发环境下添加更多调试信息
  if (process.env.NODE_ENV === 'development') {
    baseErrorResponse.details = err.stack;
  }
  
  try {
    // 尝试序列化响应
    const jsonString = JSON.stringify(baseErrorResponse);
    
    // 验证序列化后的字符串是否为有效的JSON
    JSON.parse(jsonString);
    
    // 记录响应日志
    console.log('[错误处理] 发送JSON响应:', jsonString);
    
    // 发送响应
    return res.status(statusCode).send(jsonString);
  } catch (jsonError) {
    // 序列化失败时的处理
    console.error('[错误处理] JSON序列化失败:', jsonError);
    
    // 使用最简单的回退响应
    const fallbackResponse = JSON.stringify({
      error: true,
      message: '服务器内部错误',
      status: 500,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).send(fallbackResponse);
  }
});

// 处理前端路由
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});


const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT)
  .on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please try a different port.`);
      process.exit(1);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  })
  .on('listening', () => {
    console.log(`Server is running on port ${PORT}`);
  });