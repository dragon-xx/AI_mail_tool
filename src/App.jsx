import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Inbox from './components/Inbox';
import MailList from './components/MailList';
import MailDetail from './components/MailDetail';

// 配置axios默认设置
axios.defaults.baseURL = import.meta.env.PROD ? '/.netlify/functions' : '/api';

// 配置axios请求拦截器
axios.interceptors.request.use(config => {
  const loginState = localStorage.getItem('loginState');
  config.headers['x-login-state'] = loginState || 'false';
  return config;
});

const App = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // 模拟从服务器获取邮件数据
    const mockMessages = [
      {
        id: '1',
        subject: '项目进度报告',
        from: 'manager@company.com',
        content: '请查看附件中的项目进度报告，并提供您的反馈。',
        date: '2024-03-31T10:00:00',
        isUrgent: true,
        isInternal: true,
        category: 'project'
      },
      {
        id: '2',
        subject: '客户反馈建议',
        from: 'customer@external.com',
        content: '我们收到了一些客户对产品的反馈和建议，请查看详情。',
        date: '2024-03-31T11:30:00',
        isUrgent: false,
        isInternal: false,
        category: 'feedback'
      }
    ];
    setMessages(mockMessages);
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const savedLoginState = localStorage.getItem('loginState');
      if (savedLoginState) {
        const loginData = JSON.parse(savedLoginState);
        setIsLoggedIn(loginData.isLoggedIn || false);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error parsing loginState:', error);
      setIsLoggedIn(false);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('loginState');
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/inbox" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
        } />
        <Route path="/inbox" element={
          isLoggedIn ? <Inbox onLogout={handleLogout} /> : <Navigate to="/login" replace />
        } />
        <Route path="/mail-list" element={
          isLoggedIn ? <MailList messages={messages} /> : <Navigate to="/login" replace />
        } />
        <Route path="/mail/:id" element={
          isLoggedIn ? <MailDetail messages={messages} /> : <Navigate to="/login" replace />
        } />
        <Route path="/" element={
          <Navigate to={isLoggedIn ? "/inbox" : "/login"} replace />
        } />
      </Routes>
    </Router>
  );
};

export default App;
