import React, { useState } from 'react';
import axios from 'axios';

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handleSubmit = async (values) => {
    setLoading(true);
    message.loading('正在验证登录信息...', 0);

    try {
      const response = await fetch(import.meta.env.PROD ? '/.netlify/functions/login' : '/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: '服务器返回了非JSON格式的响应' };
        console.error('非JSON响应:', text);
      }
      
      if (!response.ok) {
        const errorCode = response.status;
        const errorMessage = data.message || '未知错误';
        throw new Error(JSON.stringify({ code: errorCode, message: errorMessage }));
      }

      message.destroy();
      message.success('登录成功');
      localStorage.setItem('loginState', JSON.stringify({
        isLoggedIn: true,
        email: values.email,
        password: values.password
      }));
      onLoginSuccess();
      navigate('/inbox');
    } catch (error) {
      message.destroy();
      let errorMessage;
      
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = errorData.message;
      } catch {
        errorMessage = error.message || '登录失败，请稍后重试';
      }

      message.error(errorMessage);
      console.error('登录错误：', { code: errorCode, message: errorMessage, error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="login-form-title">邮箱登录</h1>
        <Form
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱地址' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱地址"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;
