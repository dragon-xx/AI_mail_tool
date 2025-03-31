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
    xAxis: {
      type: 'category',
      data: ['总邮件数', '紧急邮件']
    },
    yAxis: {
      type: 'value',
      name: '数量（封）'
    },
    series: [{
      data: [
        statistics.weeklyTotal,
        statistics.weeklyUrgent
      ],
      type: 'bar',
      showBackground: true,
      backgroundStyle: {
        color: 'rgba(180, 180, 180, 0.2)'
      }
    }]
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
      <Card>
        <ReactEcharts option={getWeeklyBarOption()} style={{ height: '400px' }} />
      </Card>
    </div>
  );
};

export default MailCharts;