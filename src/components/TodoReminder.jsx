import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, TimePicker, Button, notification, Space } from 'antd';
import { BellOutlined } from '@ant-design/icons';

const TodoReminder = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [reminders, setReminders] = useState([]);

  // 固定时间提醒选项
  const fixedTimeOptions = [
    { label: '每周一', value: 'MONDAY' },
    { label: '每周五', value: 'FRIDAY' },
    { label: '每月1日', value: 'MONTH_1' },
    { label: '每月15日', value: 'MONTH_15' },
    { label: '每年1月1日', value: 'YEAR_1_1' },
    { label: '每年7月1日', value: 'YEAR_7_1' }
  ];

  useEffect(() => {
    // 从localStorage加载提醒设置
    const savedReminders = JSON.parse(localStorage.getItem('todoReminders') || '[]');
    setReminders(savedReminders);

    // 设置定时器检查提醒
    const checkReminders = () => {
      const now = new Date();
      reminders.forEach(reminder => {
        if (shouldTriggerReminder(reminder, now)) {
          notification.info({
            message: '待办事项提醒',
            description: '您有待办事项需要处理',
            icon: <BellOutlined style={{ color: '#1890ff' }} />
          });
        }
      });
    };

    const timer = setInterval(checkReminders, 60000); // 每分钟检查一次
    return () => clearInterval(timer);
  }, [reminders]);

  const shouldTriggerReminder = (reminder, now) => {
    const currentDay = now.getDay();
    const currentDate = now.getDate();
    const currentMonth = now.getMonth() + 1;

    switch (reminder.type) {
      case 'fixed':
        switch (reminder.time) {
          case 'MONDAY':
            return currentDay === 1;
          case 'FRIDAY':
            return currentDay === 5;
          case 'MONTH_1':
            return currentDate === 1;
          case 'MONTH_15':
            return currentDate === 15;
          case 'YEAR_1_1':
            return currentMonth === 1 && currentDate === 1;
          case 'YEAR_7_1':
            return currentMonth === 7 && currentDate === 1;
          default:
            return false;
        }
      case 'custom':
        const reminderDate = new Date(reminder.customDate);
        return (
          reminderDate.getDate() === now.getDate() &&
          reminderDate.getMonth() === now.getMonth() &&
          reminderDate.getFullYear() === now.getFullYear() &&
          reminderDate.getHours() === now.getHours() &&
          reminderDate.getMinutes() === now.getMinutes()
        );
      default:
        return false;
    }
  };

  const handleAddReminder = () => {
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      const newReminder = {
        id: Date.now(),
        type: values.reminderType,
        time: values.reminderType === 'fixed' ? values.fixedTime : null,
        customDate: values.reminderType === 'custom' ? values.customDate.toDate() : null
      };

      const updatedReminders = [...reminders, newReminder];
      setReminders(updatedReminders);
      localStorage.setItem('todoReminders', JSON.stringify(updatedReminders));

      setIsModalVisible(false);
      form.resetFields();
    });
  };

  return (
    <>
      <Button
        type="text"
        icon={<BellOutlined />}
        onClick={handleAddReminder}
        style={{ marginBottom: 16 }}
      >
        设置提醒
      </Button>

      <Modal
        title="添加待办提醒"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="reminderType"
            label="提醒类型"
            rules={[{ required: true, message: '请选择提醒类型' }]}
          >
            <Select>
              <Select.Option value="fixed">固定时间</Select.Option>
              <Select.Option value="custom">自定义时间</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues?.reminderType !== currentValues?.reminderType
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('reminderType') === 'fixed' ? (
                <Form.Item
                  name="fixedTime"
                  label="固定时间"
                  rules={[{ required: true, message: '请选择固定时间' }]}
                >
                  <Select options={fixedTimeOptions} />
                </Form.Item>
              ) : getFieldValue('reminderType') === 'custom' ? (
                <Form.Item
                  name="customDate"
                  label="自定义时间"
                  rules={[{ required: true, message: '请选择自定义时间' }]}
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TodoReminder;