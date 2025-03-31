import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Space, Button } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const MailDetail = ({ messages }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const message = messages?.find(msg => msg.id === id);

  if (!message) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2}>邮件不存在</Title>
        <Button type="primary" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined /> 返回
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space style={{ marginBottom: '16px' }}>
        <Button type="primary" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined /> 返回
        </Button>
      </Space>

      <Card>
        <Title level={2}>
          <MailOutlined style={{ marginRight: '8px' }} />
          {message.subject}
          {message.isUrgent && (
            <Tag color="red" style={{ marginLeft: '8px' }}>
              紧急
            </Tag>
          )}
        </Title>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space direction="vertical">
            <Text strong>发件人：</Text>
            <Text>{message.from}</Text>
          </Space>

          <Space direction="vertical">
            <Text strong>发送时间：</Text>
            <Text>{new Date(message.date).toLocaleString()}</Text>
          </Space>

          <Space direction="vertical">
            <Text strong>正文：</Text>
            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Paragraph>
          </Space>

          {message.attachments && message.attachments.length > 0 && (
            <Space direction="vertical">
              <Text strong>附件：</Text>
              <Space wrap>
                {message.attachments.map((attachment, index) => (
                  <Button key={index} type="link" onClick={() => window.open(attachment.url)}>
                    {attachment.name}
                  </Button>
                ))}
              </Space>
            </Space>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default MailDetail;