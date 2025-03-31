import React, { useState } from 'react';
import { Form, Input, Select, DatePicker, Radio, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;

const SearchMail = ({ onSearch }) => {
  const [form] = Form.useForm();
  const [searchMode, setSearchMode] = useState('fuzzy'); // 'fuzzy' or 'exact'

  const handleSearch = () => {
    form.validateFields().then(values => {
      const searchParams = {
        ...values,
        searchMode,
        dateRange: values.dateRange ? [
          values.dateRange[0].format('YYYY-MM-DD'),
          values.dateRange[1].format('YYYY-MM-DD')
        ] : undefined
      };
      onSearch(searchParams);
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      style={{ padding: '16px' }}
    >
      <Form.Item name="searchField" label="搜索字段">
        <Select defaultValue="subject">
          <Option value="from">发件人</Option>
          <Option value="to">收件人</Option>
          <Option value="subject">邮件主题</Option>
          <Option value="content">邮件内容</Option>
        </Select>
      </Form.Item>

      <Form.Item name="searchValue" label="搜索内容">
        <Input placeholder="请输入搜索内容" />
      </Form.Item>

      <Form.Item name="dateRange" label="时间范围">
        <RangePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item label="查询模式">
        <Radio.Group
          value={searchMode}
          onChange={e => setSearchMode(e.target.value)}
        >
          <Radio.Button value="fuzzy">模糊查询</Radio.Button>
          <Radio.Button value="exact">精确查询</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          block
        >
          搜索
        </Button>
      </Form.Item>
    </Form>
  );
};

export default SearchMail;