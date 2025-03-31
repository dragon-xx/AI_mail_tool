import React, { useState, useEffect } from 'react';
import { Card, Typography, List, Tag, Progress, Row, Col, Statistic } from 'antd';
import { RobotOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MailCharts from './MailCharts';
import { categoryNames, getInitialCategories, analyzeCategories, analyzeStatistics } from '../services/mailCategoryService';

const { Title, Text, Paragraph } = Typography;

const AIAnalysis = ({ messages }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(getInitialCategories());
  const [statistics, setStatistics] = useState({ weeklyTotal: 0, weeklyUrgent: 0 });

  // 获取当前用户邮箱后缀
  const loginState = JSON.parse(localStorage.getItem('loginState') || '{}');
  const userEmailDomain = loginState.email ? loginState.email.split('@')[1] : '';

  useEffect(() => {
    const fetchData = async () => {
      const [categoriesData, statisticsData] = await Promise.all([
        analyzeCategories(messages, userEmailDomain),
        analyzeStatistics(messages)
      ]);
      setCategories(categoriesData);
      setStatistics(statisticsData);
    };
    fetchData();
  }, [messages, userEmailDomain]);

  // 渲染邮件类型统计
  const renderCategoryStats = (type) => {
    return Object.entries(categoryNames[type]).map(([key, name]) => {
      if (key === 'total') return null;
      const count = categories[type][key] || 0;
      return (
        <List.Item key={key}>
          <Row style={{ width: '100%' }}>
            <Col span={16}>
              <Text>{name}</Text>
            </Col>
            <Col span={8} style={{ textAlign: 'right' }}>
              <Tag color={count > 0 ? 'blue' : 'default'}>{count}</Tag>
            </Col>
          </Row>
        </List.Item>
      );
    }).filter(Boolean);
  };



  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <RobotOutlined style={{ marginRight: '8px' }} />
        AI 邮件分析
      </Title>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title={<><MailOutlined /> 本周邮件统计</>}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="总邮件数" value={statistics.weeklyTotal} />
              </Col>
              <Col span={12}>
                <Statistic title="紧急邮件" value={statistics.weeklyUrgent} />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<><TeamOutlined /> 邮件来源分布</>}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="内部邮件" value={categories.internal.total || 0} />
              </Col>
              <Col span={12}>
                <Statistic title="外部邮件" value={categories.external.total || 0} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="内部邮件分类" style={{ marginTop: '16px' }}>
        <Row gutter={[16, 16]}>
          {Object.entries(categories.internal)
            .filter(([key]) => key !== 'total')
            .map(([key, value]) => (
              <Col span={6} key={key}>
                <Card
                  size="small"
                  title={categoryNames.internal[key]}
                  headStyle={{ background: '#e6f7ff', color: '#1890ff' }}
                  bordered
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => navigate(`/mail-list?type=internal&category=${key}`)}
                >
                  <Statistic 
                    value={value || 0} 
                    suffix="封" 
                    valueStyle={{ color: '#1890ff', fontSize: '18px' }} 
                  />
                </Card>
              </Col>
            ))}
        </Row>
      </Card>

      <Card title="外部邮件分类" style={{ marginTop: '16px' }}>
        <Row gutter={[16, 16]}>
          {Object.entries(categories.external)
            .filter(([key]) => key !== 'total')
            .map(([key, value]) => (
              <Col span={6} key={key}>
                <Card
                  size="small"
                  title={categoryNames.external[key]}
                  headStyle={{ background: '#f6ffed', color: '#52c41a' }}
                  bordered
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => navigate(`/mail-list?type=external&category=${key}`)}
                >
                  <Statistic 
                    value={value || 0} 
                    suffix="封" 
                    valueStyle={{ color: '#52c41a', fontSize: '18px' }} 
                  />
                </Card>
              </Col>
            ))}
        </Row>
      </Card>

      <MailCharts categories={categories} statistics={statistics} />
    </div>
  );
};

export default AIAnalysis;