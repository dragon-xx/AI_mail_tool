import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { List, Card, Tag, Typography, Space } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { categoryNames } from '../services/mailCategoryService';

const { Title, Text } = Typography;

const MailList = ({ messages }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [filteredMessages, setFilteredMessages] = useState([]);

  // 从URL参数中获取类目信息
  const searchParams = new URLSearchParams(location.search);
  const category = searchParams.get('category');
  const type = searchParams.get('type');

  useEffect(() => {
    if (!category || !type || !messages) {
      setFilteredMessages([]);
      return;
    }

    // 获取用户邮箱域名
    const loginState = JSON.parse(localStorage.getItem('loginState') || '{}');
    const userEmailDomain = loginState.email ? loginState.email.split('@')[1] : '';

    // 根据类目过滤邮件
    const filtered = messages.filter(message => {
      const from = message.from?.[0] || '';
      const subject = message.subject?.[0] || '';
      const isInternal = from.includes('@') && from.split('@')[1] === userEmailDomain;

      // 根据邮件类型（内部/外部）进行初步过滤
      if (type === 'internal' && !isInternal) return false;
      if (type === 'external' && isInternal) return false;

      // 根据具体类别进行过滤
      if (type === 'internal') {
        switch(category) {
          case 'meeting':
            return subject.includes('会议') || subject.includes('会议安排');
          case 'dataCollection':
            return subject.includes('信息采集') || subject.includes('数据收集');
          case 'feedback':
            return subject.includes('需求反馈') || subject.includes('问题反馈');
          case 'fileTransfer':
            return subject.includes('附件') || subject.includes('文件传输');
          case 'schedule':
            return subject.includes('本周日程') || subject.includes('月度日程') || subject.includes('季度日程');
          case 'projectProgress':
            return subject.includes('项目进展') || subject.includes('项目汇报');
          case 'workSummary':
            return subject.includes('周报') || subject.includes('月度总结') || subject.includes('季度总结');
          case 'companyActivity':
            return subject.includes('公司活动') || subject.includes('活动通知');
          case 'salary':
            return subject.includes('考核结果') || subject.includes('工资福利');
          case 'reply':
            return subject.includes('已知悉') || subject.includes('收到') || subject.includes('已阅') || subject.includes('已回复');
          case 'other':
            return true;
          default:
            return false;
        }
      } else {
        switch(category) {
          case 'purchase':
            return subject.includes('采购') || subject.includes('采购事项');
          case 'partnerProgress':
            return subject.includes('项目进展') || subject.includes('合作商项目');
          case 'materialSubmission':
            return subject.includes('材料报送') || subject.includes('资料提交');
          case 'supervision':
            return subject.includes('上级部门') || subject.includes('监管部门') || subject.includes('报送通知');
          case 'association':
            return subject.includes('行业协会') || subject.includes('会议邀请') || subject.includes('信息征集');
          case 'reply':
            return subject.includes('已知悉') || subject.includes('收到') || subject.includes('已阅') || subject.includes('已回复');
          case 'spam':
            // 检查可疑发件人特征
            const suspiciousSenderPatterns = [
              '@unknown.com',
              'noreply@',
              'admin@',
              'support@',
              'marketing@',
              'info@',
              'service@',
              'no-reply@',
              'newsletter@',
              'mail@'
            ];
            const hasSuspiciousSender = suspiciousSenderPatterns.some(pattern => from.toLowerCase().includes(pattern));
            
            // 检查可疑主题关键词
            const suspiciousSubjectKeywords = [
              '中奖',
              '奖金',
              '账户异常',
              '紧急通知',
              '验证',
              'urgent',
              'warning',
              'account',
              '优惠',
              '促销',
              '特价',
              '限时',
              '中大奖',
              '恭喜',
              '验证码',
              '账号安全',
              '异常登录',
              '中签',
              '抽奖',
              'congratulation',
              'prize',
              'lottery',
              'discount',
              'offer',
              'limited time',
              'verification',
              'security alert'
            ];
            const hasSuspiciousSubject = suspiciousSubjectKeywords.some(keyword => 
              subject.toLowerCase().includes(keyword.toLowerCase())
            );
            
            return hasSuspiciousSender || hasSuspiciousSubject;
          case 'partner':
            return true;
          case 'other':
            return true;
          default:
            return false;
        }
      }
    });

    setFilteredMessages(filtered);
  }, [messages, category, type]);

  const handleMailClick = (message) => {
    navigate(`/mail/${message.id}`);
  };

  const getCategoryName = () => {
    if (!category || !type) return '';
    return categoryNames[type][category] || '';
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <MailOutlined style={{ marginRight: '8px' }} />
        {getCategoryName()}邮件列表
      </Title>

      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={filteredMessages}
        renderItem={message => (
          <List.Item>
            <Card
              hoverable
              onClick={() => handleMailClick(message)}
              style={{ cursor: 'pointer' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Text strong>{message.subject}</Text>
                  {message.isUrgent && <Tag color="red">紧急</Tag>}
                  {type === 'external' && category === 'spam' && (
                    <Space>
                      <Tag color="orange">可疑邮件</Tag>
                      {message.from.toLowerCase().includes('noreply@') && <Tag color="orange">自动发送</Tag>}
                      {message.from.toLowerCase().includes('marketing@') && <Tag color="orange">营销邮件</Tag>}
                      {message.from.toLowerCase().includes('newsletter@') && <Tag color="orange">订阅邮件</Tag>}
                      {suspiciousSubjectKeywords.some(keyword => 
                        message.subject.toLowerCase().includes(keyword.toLowerCase())
                      ) && <Tag color="red">可疑内容</Tag>}
                    </Space>
                  )}
                </Space>
                <Text type="secondary">
                  发件人: {message.from}
                  <Text type="secondary" style={{ float: 'right' }}>
                    {new Date(message.date).toLocaleString()}
                  </Text>
                </Text>
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default MailList;