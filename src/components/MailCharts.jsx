import React from 'react';
import { Card } from 'antd';
import ReactEcharts from 'echarts-for-react';
import { categoryNames } from '../services/mailCategoryService';
import { useNavigate } from 'react-router-dom';

const MailCharts = ({ categories, statistics }) => {
  const navigate = useNavigate();

  const handlePieClick = (params, type) => {
    if (params.data) {
      const categoryKey = Object.entries(categoryNames[type]).find(
        ([_, value]) => value === params.data.name
      )?.[0];
      if (categoryKey) {
        navigate(`/mail-list?type=${type}&category=${categoryKey}`);
      }
    }
  };

  // 内部邮件分布饼图配置
  const getInternalPieOption = () => ({
    title: {
      text: '内部邮件分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}封 ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: '70%',
      selectedMode: 'single',
      data: Object.entries(categories.internal)
        .filter(([key]) => key !== 'total')
        .map(([key, value]) => ({
          name: categoryNames.internal[key],
          value: value || 0
        })),
      onclick: (params) => handlePieClick(params, 'internal'),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  });

  // 外部邮件分布饼图配置
  const getExternalPieOption = () => ({
    title: {
      text: '外部邮件分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}封 ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: '70%',
      selectedMode: 'single',
      data: Object.entries(categories.external)
        .filter(([key]) => key !== 'total')
        .map(([key, value]) => ({
          name: categoryNames.external[key],
          value: value || 0
        })),
      onclick: (params) => handlePieClick(params, 'external'),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  });

  // 周邮件趋势柱状图配置
  const getWeeklyBarOption = () => ({
    title: {
      text: '本周邮件统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['总量', '紧急', '发件', '收件', '已办', '待办'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: ['总邮件', '内部邮件', '外部邮件']
    },
    yAxis: {
      type: 'value',
      name: '数量（封）'
    },
    series: [
      {
        name: '总量',
        data: [
          statistics.weeklyTotal,
          statistics.weeklySentInternal + statistics.weeklyReceivedInternal,
          statistics.weeklySentExternal + statistics.weeklyReceivedExternal
        ],
        type: 'bar',
        stack: 'total'
      },
      {
        name: '紧急',
        data: [statistics.weeklyUrgent, 0, 0],
        type: 'bar',
        stack: 'status'
      },
      {
        name: '发件',
        data: [
          statistics.weeklySent,
          statistics.weeklySentInternal,
          statistics.weeklySentExternal
        ],
        type: 'bar',
        stack: 'type'
      },
      {
        name: '收件',
        data: [
          statistics.weeklyReceived,
          statistics.weeklyReceivedInternal,
          statistics.weeklyReceivedExternal
        ],
        type: 'bar',
        stack: 'type'
      },
      {
        name: '已办',
        data: [statistics.weeklyDone, 0, 0],
        type: 'bar',
        stack: 'status'
      },
      {
        name: '待办',
        data: [statistics.weeklyTodo, 0, 0],
        type: 'bar',
        stack: 'status'
      }
    ]
  });

  // 总体统计柱状图配置
  const getTotalBarOption = () => ({
    title: {
      text: '邮件总体统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['发件', '收件', '已办', '待办'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: ['内部邮件', '外部邮件']
    },
    yAxis: {
      type: 'value',
      name: '数量（封）'
    },
    series: [
      {
        name: '发件',
        data: [
          categories.internal.sent || 0,
          categories.external.sent || 0
        ],
        type: 'bar',
        stack: 'type'
      },
      {
        name: '收件',
        data: [
          categories.internal.received || 0,
          categories.external.received || 0
        ],
        type: 'bar',
        stack: 'type'
      },
      {
        name: '已办',
        data: [
          categories.internal.done || 0,
          categories.external.done || 0
        ],
        type: 'bar',
        stack: 'status'
      },
      {
        name: '待办',
        data: [
          categories.internal.todo || 0,
          categories.external.todo || 0
        ],
        type: 'bar',
        stack: 'status'
      }
    ]
  });

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <Card style={{ flex: 1 }}>
          <ReactEcharts option={getInternalPieOption()} style={{ height: '400px' }} />
        </Card>
        <Card style={{ flex: 1 }}>
          <ReactEcharts option={getExternalPieOption()} style={{ height: '400px' }} />
        </Card>
      </div>
      <Card style={{ marginBottom: '16px' }}>
        <ReactEcharts option={getWeeklyBarOption()} style={{ height: '400px' }} />
      </Card>
      <Card>
        <ReactEcharts option={getTotalBarOption()} style={{ height: '400px' }} />
      </Card>
    </div>
  );
};

export default MailCharts;