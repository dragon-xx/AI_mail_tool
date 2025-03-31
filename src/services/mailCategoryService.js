// 邮件分类服务

// 分类名称映射
export const categoryNames = {
  internal: {
    meeting: '会议通知',
    dataCollection: '信息采集',
    feedback: '需求反馈',
    fileTransfer: '文件传递',
    schedule: '日程安排',
    projectProgress: '项目进展通告',
    workSummary: '周报/工作总结',
    companyActivity: '公司活动宣传',
    salary: '考核结果及工资福利',
    reply: '日常回复事务',
    other: '其他公司内部通知',
    total: '内部邮件'
  },
  external: {
    purchase: '合作商采购事项',
    partnerProgress: '合作商项目进展',
    materialSubmission: '合作商材料报送',
    supervision: '上级部门/监管部门通知',
    association: '行业协会事务',
    reply: '日常回复事务',
    spam: '骚扰邮件或钓鱼邮件',
    partner: '合作商邮件',
    other: '其他外部邮件',
    total: '外部邮件'
  }
};

// 初始化类目数据
export const getInitialCategories = () => ({
  internal: {
    meeting: 0,
    dataCollection: 0,
    feedback: 0,
    fileTransfer: 0,
    schedule: 0,
    projectProgress: 0,
    workSummary: 0,
    companyActivity: 0,
    salary: 0,
    reply: 0,
    other: 0,
    total: 0
  },
  external: {
    purchase: 0,
    partnerProgress: 0,
    materialSubmission: 0,
    supervision: 0,
    association: 0,
    reply: 0,
    spam: 0,
    partner: 0,
    other: 0,
    total: 0
  }
});

// 垃圾邮件检测
const isSpamEmail = (from, subject) => {
  const spamKeywords = [
    '中奖', '抽奖', '优惠', '促销', '特价', '免费',
    '发财', '赚钱', '理财', '投资', '股票', '基金',
    'casino', 'lottery', 'prize', 'winner', 'bonus',
    'investment', 'stock', 'fund', 'crypto', 'bitcoin'
  ];

  const suspiciousSenderPatterns = [
    /[0-9]{8,}@/,
    /[a-zA-Z0-9]+\.[a-zA-Z0-9]+@/,
    /@(qq\.com|163\.com|126\.com|gmail\.com|outlook\.com|hotmail\.com)$/
  ];

  const hasSpamKeyword = spamKeywords.some(keyword =>
    subject.toLowerCase().includes(keyword.toLowerCase())
  );

  const isSuspiciousSender = suspiciousSenderPatterns.some(pattern =>
    pattern.test(from.toLowerCase())
  );

  return hasSpamKeyword || isSuspiciousSender;
};

// 检查是否为合作商邮箱
const isPartnerEmail = (email) => {
  const partnerEmails = [
    '@partner1.com',
    '@partner2.com',
    '@supplier.com'
  ];
  return partnerEmails.some(domain => email.toLowerCase().includes(domain.toLowerCase()));
};

// 异步分析邮件类型
export const analyzeCategories = async (messages, userEmailDomain) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const categories = messages.reduce((acc, mail) => {
        const from = mail.from?.[0] || '';
        const subject = mail.subject?.[0] || '';
        const isInternal = from.includes('@') && from.split('@')[1] === userEmailDomain;

        if (isInternal) {
          if (subject.includes('会议') || subject.includes('会议安排')) {
            acc.internal.meeting++;
          } else if (subject.includes('信息采集') || subject.includes('数据收集')) {
            acc.internal.dataCollection++;
          } else if (subject.includes('需求反馈') || subject.includes('问题反馈')) {
            acc.internal.feedback++;
          } else if (subject.includes('附件') || subject.includes('文件传输')) {
            acc.internal.fileTransfer++;
          } else if (subject.includes('本周日程') || subject.includes('月度日程') || subject.includes('季度日程')) {
            acc.internal.schedule++;
          } else if (subject.includes('项目进展') || subject.includes('项目汇报')) {
            acc.internal.projectProgress++;
          } else if (subject.includes('周报') || subject.includes('月度总结') || subject.includes('季度总结')) {
            acc.internal.workSummary++;
          } else if (subject.includes('公司活动') || subject.includes('活动通知')) {
            acc.internal.companyActivity++;
          } else if (subject.includes('考核结果') || subject.includes('工资福利')) {
            acc.internal.salary++;
          } else if (subject.includes('已知悉') || subject.includes('收到') || subject.includes('已阅') || subject.includes('已回复')) {
            acc.internal.reply++;
          } else {
            acc.internal.other++;
          }
          acc.internal.total++;
        } else {
          if (isPartnerEmail(from)) {
            acc.external.partner++;
          } else if (subject.includes('采购') || subject.includes('采购事项')) {
            acc.external.purchase++;
          } else if (subject.includes('项目进展') || subject.includes('合作商项目')) {
            acc.external.partnerProgress++;
          } else if (subject.includes('材料报送') || subject.includes('资料提交')) {
            acc.external.materialSubmission++;
          } else if (subject.includes('上级部门') || subject.includes('监管部门') || subject.includes('报送通知')) {
            acc.external.supervision++;
          } else if (subject.includes('行业协会') || subject.includes('会议邀请') || subject.includes('信息征集')) {
            acc.external.association++;
          } else if (subject.includes('已知悉') || subject.includes('收到') || subject.includes('已阅') || subject.includes('已回复')) {
            acc.external.reply++;
          } else if (isSpamEmail(from, subject)) {
            acc.external.spam++;
          } else {
            acc.external.other++;
          }
          acc.external.total++;
        }
        return acc;
      }, getInitialCategories());

      resolve(categories);
    }, 0);
  });
};

// 异步分析统计数据
export const analyzeStatistics = async (messages) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      
      const stats = messages.reduce((acc, mail) => {
        const date = new Date(mail.date?.[0]);
        const isThisWeek = date >= weekStart;

        if (isThisWeek) {
          acc.weeklyTotal++;
          if (mail.subject?.includes('紧急')) {
            acc.weeklyUrgent++;
          }

          // 统计发件和收件数量
          if (mail.type === 'sent') {
            acc.weeklySent++;
          } else {
            acc.weeklyReceived++;
          }

          // 统计已办和待办事项
          if (mail.status === 'done' || mail.subject?.includes('已处理') || mail.subject?.includes('已完成')) {
            acc.weeklyDone++;
          } else {
            acc.weeklyTodo++;
          }

          // 按分类统计发件数量
          if (mail.type === 'sent') {
            if (mail.category === 'internal') {
              acc.weeklySentInternal++;
            } else {
              acc.weeklySentExternal++;
            }
          }

          // 按分类统计收件数量
          if (mail.type !== 'sent') {
            if (mail.category === 'internal') {
              acc.weeklyReceivedInternal++;
            } else {
              acc.weeklyReceivedExternal++;
            }
          }
        }
        return acc;
      }, {
        weeklyTotal: 0,
        weeklyUrgent: 0,
        weeklySent: 0,
        weeklyReceived: 0,
        weeklyDone: 0,
        weeklyTodo: 0,
        weeklySentInternal: 0,
        weeklySentExternal: 0,
        weeklyReceivedInternal: 0,
        weeklyReceivedExternal: 0
      });

      resolve(stats);
    }, 0);
  });
};