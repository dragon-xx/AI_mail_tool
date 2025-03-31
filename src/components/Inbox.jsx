import React, { useState } from 'react';
import { Layout, Menu, List, message, Typography, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { LogoutOutlined, RobotOutlined, InboxOutlined, SearchOutlined, BellOutlined } from '@ant-design/icons';
import AIAnalysis from './AIAnalysis';
import SearchMail from './SearchMail';
import TodoReminder from './TodoReminder';

const Inbox = ({ onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState('inbox');
  const [searchResults, setSearchResults] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  React.useEffect(() => {
    fetchInbox();
    const loginState = JSON.parse(localStorage.getItem('loginState') || '{}');
    setUserEmail(loginState.email || '');
  }, []);

  // 添加重试机制的fetchInbox函数
  const fetchInbox = async (page = currentPage, retryCount = 0, maxRetries = 2) => {
    const isInitialLoad = isFirstLoad;
    console.log(`[前端] 开始获取收件箱 - 页码: ${page}, 每页数量: ${pageSize}, 时间: ${new Date().toISOString()}, 重试次数: ${retryCount}`);
    const startTime = Date.now();
    setLoadingInbox(true);
    try {
      // 从localStorage获取登录信息
      const loginState = JSON.parse(localStorage.getItem('loginState') || '{}');
      console.log(`[前端] 用户信息获取成功 - 邮箱: ${loginState.email || '未知'}`);
      
      console.log(`[前端] 发送API请求 - /api/inbox`);
      const fetchStartTime = Date.now();
      
      // 创建AbortController用于请求超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
      
      const response = await fetch(`/api/inbox?page=${page}&pageSize=${pageSize}`, {
        headers: {
          'x-login-state': JSON.stringify({
            email: loginState.email,
            password: loginState.password
          })
        },
        signal: controller.signal
      });
      
      // 请求成功，清除超时计时器
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const data = await response.json();
      setMessages(data.messages);
      setTotal(data.total);
      setCurrentPage(page);
      console.log(`[前端] 收件箱数据更新完成 - 总耗时: ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error(`[前端] 获取邮件错误:`, error);
      
      // 处理超时或网络错误，尝试重试
      if ((error.name === 'AbortError' || error.message.includes('网络') || error.message.includes('timeout')) && retryCount < maxRetries) {
        console.log(`[前端] 请求超时或网络错误，准备重试 (${retryCount + 1}/${maxRetries})`);
        message.warning(`加载超时，正在重试... (${retryCount + 1}/${maxRetries})`);
        
        // 延迟一段时间后重试
        setTimeout(() => {
          fetchInbox(page, retryCount + 1, maxRetries);
        }, 2000); // 2秒后重试
        return;
      }
      
      message.error(error.message || '获取邮件失败，请稍后重试');
    } finally {
      if (retryCount === 0 || retryCount >= maxRetries) {
        setLoadingInbox(false);
      if (isInitialLoad) {
        setIsFirstLoad(false);
        if (Date.now() - startTime > 2000) {
          message.info('首次拉取速度慢，请稍后');
        }
      }
      }
    }
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    message.success('已退出登录');
    onLogout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <Typography.Text style={{ position: 'fixed', top: '24px', left: '24px', zIndex: 1000 }}>
        {userEmail}
      </Typography.Text>
      <Layout.Sider theme="light" width={200} style={{ borderRight: '1px solid #f0f0f0', background: '#fff', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, paddingTop: '60px' }}>
        <Menu
          mode="vertical"
          selectedKeys={[selectedMenu]}
          style={{ height: '100%', borderRight: 'none' }}
          onSelect={({ key }) => {
            setSelectedMenu(key);
            if (key === 'inbox') {
              fetchInbox();
            }
          }}
          items={[
            {
              key: 'inbox',
              icon: <InboxOutlined />,
              label: '收件箱'
            },
            {
              key: 'ai',
              icon: <RobotOutlined />,
              label: 'AI分析'
            },
            {
              key: 'search',
              icon: <SearchOutlined />,
              label: '邮件检索'
            },
            {
              key: 'reminder',
              icon: <BellOutlined />,
              label: '待办提醒'
            },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: '退出',
              onClick: handleLogout
            }
          ]}
        />
      </Layout.Sider>
      <Layout.Content style={{ padding: '24px', background: '#fff', margin: '24px 24px 24px 224px', borderRadius: '8px', minHeight: 'calc(100vh - 48px)' }}>
        {selectedMenu === 'inbox' && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchInbox(currentPage)}
              loading={loadingInbox}
              style={{ marginBottom: 16 }}
            >
              刷新
            </Button>
            <List
              loading={loadingInbox}
              dataSource={messages}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                onChange: (page) => fetchInbox(page),
                showSizeChanger: false
              }}
              renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={item.subject?.[0] || '(无主题)'}
                  description={
                    <>
                      <div>发件人: {item.from?.[0] || '未知'}</div>
                      <div>时间: {item.date?.[0] || '未知'}</div>
                    </>
                  }
                />
              </List.Item>
            )}
          />
          </Space>
        )}
        {selectedMenu === 'ai' && <AIAnalysis messages={messages} />}
        {selectedMenu === 'reminder' && <TodoReminder />}
        {selectedMenu === 'search' && (
          <SearchMail
            onSearch={(searchParams) => {
              const loginState = JSON.parse(localStorage.getItem('loginState') || '{}');
              const userEmailDomain = loginState.email ? loginState.email.split('@')[1] : '';
              
              let filtered = messages;
              
              // 按时间范围过滤
              if (searchParams.dateRange) {
                const [startDate, endDate] = searchParams.dateRange;
                filtered = filtered.filter(message => {
                  const messageDate = new Date(message.date?.[0]).toISOString().split('T')[0];
                  return messageDate >= startDate && messageDate <= endDate;
                });
              }
              
              // 按搜索字段和内容过滤
              if (searchParams.searchValue) {
                const searchValue = searchParams.searchValue.toLowerCase();
                filtered = filtered.filter(message => {
                  const field = searchParams.searchField;
                  const value = message[field]?.[0]?.toLowerCase() || '';
                  
                  if (searchParams.searchMode === 'exact') {
                    return value === searchValue;
                  } else {
                    return value.includes(searchValue);
                  }
                });
              }
              
              setSearchResults(filtered);
            }}
          />
        )}
      </Layout.Content>
    </Layout>
  );
};

export default Inbox;