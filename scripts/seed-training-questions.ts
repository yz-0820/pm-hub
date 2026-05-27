import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_URL || './data/sqlite.db';
const sqlite = new Database(dbPath);

function logoUrlFor(questionKey: string): string {
  const s2 = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const map: Record<string, string> = {
    pt_internet_mobile_tiktok_shop: s2('douyin.com'),
    pt_finance_mobile_wealth_mgmt: s2('cmbchina.com'),
    pt_education_web_k12_learning: s2('yuanfudao.com'),
    pt_internet_mobile_wechat_mini_programs: s2('wechat.com'),
    pt_retail_mobile_meituan_delivery_fulfillment: s2('meituan.com'),
    pt_retail_mobile_temu_crossborder_growth: s2('temu.com'),
    pt_internet_web_netflix_churn_pricing: s2('netflix.com'),
    pt_internet_web_airbnb_trust_safety: s2('airbnb.com'),
    pt_healthcare_mobile_pingan_good_doctor_triage: s2('pingan.com'),
    pt_internet_hardware_xiaomi_iot_onboarding: s2('mi.com'),
    pt_retail_saas_shopify_ecosystem: s2('shopify.com'),
    pt_internet_saas_zoom_retention_enterprise: s2('zoom.us'),
    pt_finance_mobile_alipay_credit_growth_risk: s2('alipay.com'),
    pt_retail_saas_jd_logistics_warehouse_delivery: s2('jd.com'),
    pt_education_mobile_duolingo_learning_effect: s2('duolingo.com'),
  };
  return map[questionKey] || '';
}

const seedQuestions = [
  {
    question_key: 'pt_internet_mobile_tiktok_shop',
    title: '拆解：抖音电商的“短视频种草-直播转化”闭环',
    industry: 'internet',
    product_type: 'mobile_app',
    difficulty: 'intermediate',
    prompt:
      '背景：抖音电商以“内容分发”驱动交易转化，典型链路为短视频/图文种草 → 直播间转化 → 履约与复购。\n\n核心问题：在内容平台内，如何同时提升转化效率与用户体验，并建立可持续的供给生态？\n\n任务：请以“短视频种草-直播转化”链路为对象，完成一次产品拆解。要求覆盖用户价值、商业逻辑、核心功能设计与竞争分析，并给出你认为最关键的改进点与验证方式（指标、实验、对照组）。',
    reference_points: JSON.stringify([
      '目标用户与关键场景（内容消费→兴趣激发→购买决策）',
      '关键指标与转化漏斗（曝光/点击/加购/下单/复购）',
      '供给侧（商家/达人/机构）激励与约束',
      '商业化（佣金/广告/服务费）与成本结构',
      '核心功能（推荐/直播间/商品卡/履约/售后）及取舍',
      '竞品对比（快手/淘宝直播）差异点与护城河',
      '内容治理与信任（虚假宣传、售后纠纷、低质供给）',
    ]),
  },
  {
    question_key: 'pt_finance_mobile_wealth_mgmt',
    title: '拆解：银行理财 App 的“新客转化与留存”体系',
    industry: 'finance',
    product_type: 'mobile_app',
    difficulty: 'advanced',
    prompt:
      '背景：银行理财 App 需要在强合规约束下完成“获客→转化→教育→交易→复购/留存”的闭环，并兼顾客户信任与风险控制。\n\n核心问题：如何用产品机制提升新客首投率与长期留存，同时不触碰适当性、信息披露等监管红线？\n\n任务：请拆解其产品结构与增长机制，给出关键功能设计取舍、指标体系与竞品对比，并提出可落地的改进方案（含验证方法）。',
    reference_points: JSON.stringify([
      '用户分层（保守/稳健/进取）与风险承受能力',
      '合规约束（适当性、信息披露、风险提示）对产品的影响',
      '增长路径（渠道/活动/内容教育/顾问服务）',
      '商业逻辑（AUM、费率、交叉销售）',
      '关键功能（产品筛选、组合、投研内容、持仓、回撤展示）',
      '竞品对比（招行、蚂蚁财富、天天基金）差异点与策略',
      '信任建立机制（投前教育、投后陪伴、风险情绪管理）',
    ]),
  },
  {
    question_key: 'pt_education_web_k12_learning',
    title: '拆解：K12 在线学习平台的“学习效果”机制设计',
    industry: 'education',
    product_type: 'web',
    difficulty: 'intermediate',
    prompt:
      '背景：K12 在线学习平台从“看课”走向“学会”，核心竞争力从内容供给转向效果交付（学习增益、掌握度、迁移能力）。\n\n核心问题：如何用产品机制提升学习效果，而不仅是完课率？\n\n任务：请拆解学习效果的定义、关键机制（诊断-练习-反馈-复习）、商业闭环与竞品差异，并提出可验证的改进建议（指标与实验）。',
    reference_points: JSON.stringify([
      '学习目标与评价标准（掌握度、迁移、错因）',
      '关键机制（诊断测、个性化路径、错题本、间隔复习）',
      '内容供给（老师/题库/课程）与质量控制',
      '商业逻辑（续费、转介绍、获客成本）',
      '核心功能（学习路径、练习、作业、反馈、家长端）',
      '竞品对比（猿辅导/学而思/网易有道）差异点',
      '反作弊与学习动机（刷题、代练、奖励机制副作用）',
    ]),
  },
  {
    question_key: 'pt_internet_mobile_wechat_mini_programs',
    title: '拆解：微信小程序生态的“平台治理与增长”策略',
    industry: 'internet',
    product_type: 'mobile_app',
    difficulty: 'advanced',
    prompt:
      '背景：微信小程序连接了海量商家与服务场景，平台要在“开放能力、分发机制、商业化与治理”之间做长期权衡。\n\n核心问题：如何在不牺牲用户体验与安全的前提下，推动小程序生态增长与平台变现？\n\n任务：请从用户/开发者/商家三方视角拆解平台策略（分发、能力、激励、治理），并给出可执行的产品/机制改进方案与验证路径。',
    reference_points: JSON.stringify([
      '生态角色与激励：用户/开发者/商家/服务商/平台',
      '分发机制：搜索、附近、社交分享、公众号/视频号联动',
      '能力开放：支付、登录、订阅消息、位置、开放数据',
      '治理策略：审核、违规处理、隐私与数据合规、风控',
      '商业化：广告、交易抽佣、增值服务与平台成本',
      '关键指标：生态活跃、留存、转化、违规率与投诉率',
    ]),
  },
  {
    question_key: 'pt_retail_mobile_meituan_delivery_fulfillment',
    title: '拆解：美团外卖的“高峰期履约”与用户体验优化',
    industry: 'retail',
    product_type: 'mobile_app',
    difficulty: 'advanced',
    prompt:
      '背景：美团外卖在午晚高峰面临供需波动、履约时效与成本之间的矛盾；用户对“准时、稳定、可预期”的体验极其敏感。\n\n核心问题：如何在高峰期提升履约稳定性（准时率、时长方差），同时控制补贴与骑手成本？\n\n任务：请拆解供需匹配、调度策略、价格/补贴、商家侧协同与用户侧预期管理，并给出可验证的改进方案（指标、实验设计、风控）。',
    reference_points: JSON.stringify([
      '链路拆解：下单-备餐-取餐-配送-签收-售后',
      '关键指标：准时率、平均时长、时长方差、取消率、投诉率',
      '供需匹配：骑手密度、订单密度、区域热力与预测',
      '商家协同：出餐时长、缺货替代、打包与取餐动线',
      '用户预期：时间展示、超时补偿、拆单与合单策略',
      '竞品对比：饿了么/闪送等履约策略差异',
    ]),
  },
  {
    question_key: 'pt_retail_mobile_temu_crossborder_growth',
    title: '拆解：Temu（拼多多海外）“低价扩张”策略的可持续性',
    industry: 'retail',
    product_type: 'mobile_app',
    difficulty: 'advanced',
    prompt:
      '背景：Temu 通过极致低价与强投放快速获取海外用户，但长期面临履约成本、商品质量、品牌信任与监管合规挑战。\n\n核心问题：如何从“买量驱动”走向“留存与复购驱动”，并建立可持续的供给与履约体系？\n\n任务：请拆解其增长漏斗、供给策略、定价机制、履约链路与风控，提出阶段性策略（进入期/扩张期/稳定期）与可验证方案。',
    reference_points: JSON.stringify([
      '增长漏斗：投放→下载→首单→复购→长期留存',
      '定价与补贴：极致低价的成本构成与边界',
      '供给策略：工厂直供、品控、选品与上新机制',
      '履约与体验：跨境时效、退换货、客服与赔付',
      '信任与合规：假货、隐私、税务与平台规则',
      '竞品对比：Shein、Amazon、AliExpress',
    ]),
  },
  {
    question_key: 'pt_internet_web_netflix_churn_pricing',
    title: '拆解：Netflix 的“降本增收”与会员留存（含共享账号治理）',
    industry: 'internet',
    product_type: 'web',
    difficulty: 'intermediate',
    prompt:
      '背景：Netflix 在流媒体竞争加剧、内容成本高企的背景下，通过广告套餐、账号共享治理与内容策略来提升收入与留存。\n\n核心问题：如何在限制共享账号的同时降低流失，并让用户接受新的价格与套餐结构？\n\n任务：请拆解用户分层、套餐策略、内容供给、推荐与留存机制，提出可落地的策略组合与验证指标。',
    reference_points: JSON.stringify([
      '用户分层：轻度/重度、家庭/个人、价格敏感度',
      '套餐与定价：广告版/标准版/高端版的价值锚点',
      '共享治理：识别、提示、加购成员与体验摩擦控制',
      '内容策略：自制内容 ROI、长尾内容与本地化',
      '留存机制：推荐、追剧节奏、通知与运营触达',
      '竞品对比：Disney+、Prime Video、爱奇艺等',
    ]),
  },
  {
    question_key: 'pt_internet_web_airbnb_trust_safety',
    title: '拆解：Airbnb 的“信任与安全”体系升级（房源质量与纠纷治理）',
    industry: 'internet',
    product_type: 'web',
    difficulty: 'advanced',
    prompt:
      '背景：Airbnb 的双边市场高度依赖信任。随着规模扩大，房源质量不一致、虚假描述、取消与纠纷会显著影响转化与复购。\n\n核心问题：如何在不大幅提高运营成本的前提下，提升房源质量与纠纷处理效率，并保护平台品牌？\n\n任务：请从“供给准入、评价体系、风险识别、售后仲裁、赔付机制”拆解解决方案，并给出指标与落地节奏。',
    reference_points: JSON.stringify([
      '双边市场：房东激励与房客体验的平衡',
      '准入与质检：认证、照片、规则、抽检与分层治理',
      '评价体系：可信度、刷评对抗、权重与展示策略',
      '风险识别：高风险订单/房源/用户的特征与风控',
      '纠纷处理：证据链、仲裁流程、赔付与客服效率',
      '关键指标：转化率、退款率、纠纷率、NPS、复购率',
    ]),
  },
  {
    question_key: 'pt_healthcare_mobile_pingan_good_doctor_triage',
    title: '拆解：平安好医生的“在线问诊分诊”与商业化路径',
    industry: 'healthcare',
    product_type: 'mobile_app',
    difficulty: 'advanced',
    prompt:
      '背景：在线问诊需要在医疗合规、诊疗质量与效率之间平衡，并与药品/检查/保险等业务形成闭环。\n\n核心问题：如何设计“分诊与导诊”机制，在提升用户满意度的同时，提高医生供给利用率与商业转化？\n\n任务：请拆解问诊流程、分诊策略、质控与合规、医生激励，以及与药品/保险的衔接，并提出可验证的改进方案。',
    reference_points: JSON.stringify([
      '用户场景：轻症咨询、慢病复诊、用药咨询、报告解读',
      '分诊策略：自助问答、规则/模型分诊、人工导诊',
      '医生供给：排班、定价、激励、服务质量与评价',
      '合规与质控：处方、留痕、风险提示与灰色地带',
      '商业闭环：问诊→购药→随访/慢病管理→保险',
      '关键指标：接诊时长、满意度、复诊率、转化率、投诉率',
    ]),
  },
  {
    question_key: 'pt_internet_hardware_xiaomi_iot_onboarding',
    title: '拆解：小米米家（Xiaomi Home）IoT 设备“连接与留存”体验',
    industry: 'internet',
    product_type: 'hardware',
    difficulty: 'intermediate',
    prompt:
      '背景：IoT 生态产品的增长往往被“首连成功率、场景配置成本、跨设备协同”所制约；体验差会直接导致退货与沉默。\n\n核心问题：如何提升设备首连成功率与后续留存，让用户真正建立“场景化使用习惯”？\n\n任务：请拆解设备接入、账号体系、场景/自动化、通知与数据展示，并给出可验证的体验改进与增长策略。',
    reference_points: JSON.stringify([
      '首连链路：配网方式、失败原因分类与引导',
      '设备生命周期：安装-使用-维护-更换/扩展',
      '场景化：自动化规则、模板、跨设备协同',
      '家庭成员：共享、权限、隐私与多用户体验',
      '数据与反馈：告警、能耗、健康/安全类数据展示',
      '指标：首连成功率、7/30 日留存、活跃设备数、退货率',
    ]),
  },
  {
    question_key: 'pt_retail_saas_shopify_ecosystem',
    title: '拆解：Shopify 的“商家增长”与应用生态平台化',
    industry: 'retail',
    product_type: 'saas',
    difficulty: 'advanced',
    prompt:
      '背景：Shopify 作为电商 SaaS 平台，需要在“商家全生命周期（建站-获客-转化-履约-复购）”中持续交付价值，并通过 App/插件生态放大能力。\n\n核心问题：如何设计平台能力边界与生态分工，既提升商家成功率，又保证平台收入与生态健康？\n\n任务：请拆解核心能力（支付、物流、营销、数据）与生态策略（分发、定价、审核、分成），并提出关键指标与策略迭代路径。',
    reference_points: JSON.stringify([
      '商家生命周期：新手期-增长期-规模化-多渠道经营',
      '平台核心能力：支付、结账、库存、订单、履约',
      '生态策略：应用市场分发、审核、评分与治理',
      '商业模式：订阅费、支付费率、应用分成、金融服务',
      '数据能力：分析报表、归因、A/B 测试与自动化',
      '竞品对比：Magento、WooCommerce、SaaS 独立站工具',
    ]),
  },
  {
    question_key: 'pt_internet_saas_zoom_retention_enterprise',
    title: '拆解：Zoom 的“后疫情时代留存”与企业增购策略',
    industry: 'internet',
    product_type: 'saas',
    difficulty: 'intermediate',
    prompt:
      '背景：疫情后远程办公回落，Zoom 需要从“会议工具”向“协作平台”扩展，提升留存并推动企业增购。\n\n核心问题：如何降低会议疲劳与替代风险，提升企业客户的使用深度与付费升级？\n\n任务：请拆解用户场景、功能演进（会议-电话-协作-客服）、定价与续费机制，并给出可验证的增长与留存方案。',
    reference_points: JSON.stringify([
      '用户分层：个人/中小企业/大客户/教育与政企',
      '核心体验：稳定性、易用性、安全与管理后台',
      '扩展路径：电话、日历、IM/协作、会议室硬件',
      '商业策略：套餐、席位管理、增购与续费',
      '关键指标：活跃席位、会议时长、续费率、扩展产品渗透',
      '竞品对比：Teams、Google Meet、Webex',
    ]),
  },
  {
    question_key: 'pt_finance_mobile_alipay_credit_growth_risk',
    title: '拆解：支付宝“花呗/信用支付”的增长与风控平衡',
    industry: 'finance',
    product_type: 'mobile_app',
    difficulty: 'advanced',
    prompt:
      '背景：信用支付产品需要在“授信规模、交易增长、坏账风险、合规要求”之间做动态平衡，并与支付场景深度耦合。\n\n核心问题：如何在保持风险可控的前提下提升渗透率与复用率，并减少用户负担感？\n\n任务：请拆解授信、额度管理、场景引导、分期与费用、逾期管理，以及与支付/电商/生活服务的联动策略，提出指标与实验方案。',
    reference_points: JSON.stringify([
      '用户分层：信用资质、价格敏感度、消费场景偏好',
      '授信策略：额度、提额、降额与触发条件',
      '增长机制：场景引导、优惠、分期与联名活动',
      '风控链路：反欺诈、逾期预警、催收与合规边界',
      '体验与信任：费用透明、提示策略、负债管理工具',
      '指标：渗透率、复用率、逾期率、坏账率、投诉率',
    ]),
  },
  {
    question_key: 'pt_retail_saas_jd_logistics_warehouse_delivery',
    title: '拆解：京东物流的“仓配一体化”与同城即时达能力建设',
    industry: 'retail',
    product_type: 'saas',
    difficulty: 'advanced',
    prompt:
      '背景：京东物流在仓储自动化、干线与末端配送上持续投入，同时需要对外输出能力服务品牌商与商家。\n\n核心问题：如何设计“仓配一体化”产品与能力平台，让商家在不同生命周期（初创-增长-规模化）都能获得可衡量的经营提升？\n\n任务：请从产品能力（仓网、库存、路由、时效、成本）与商业模式（计费、SLA、增值服务）拆解方案，并给出关键指标与落地节奏。',
    reference_points: JSON.stringify([
      '客户画像：品牌商/商家/平台型客户的差异诉求',
      '能力拆解：仓网布局、库存分配、路由与时效承诺',
      '成本结构：仓储、人力、运输、赔付与峰值弹性',
      '产品化：SLA、对账结算、异常处理、可视化与预警',
      '同城即时达：供给调度、履约质量与体验策略',
      '指标：履约时效、成本/单、缺货率、退换货效率、客户留存',
    ]),
  },
  {
    question_key: 'pt_education_mobile_duolingo_learning_effect',
    title: '拆解：Duolingo 的“游戏化学习”如何兼顾留存与学习效果',
    industry: 'education',
    product_type: 'mobile_app',
    difficulty: 'beginner',
    prompt:
      '背景：Duolingo 以强游戏化驱动高留存，但教育产品的长期价值仍取决于学习效果。\n\n核心问题：如何在不牺牲留存的前提下，提升学习效率与真实能力提升，并降低“刷关不学会”的副作用？\n\n任务：请拆解其目标用户、学习路径、激励体系、内容难度曲线与商业化（订阅/广告），并提出可验证的优化方案。',
    reference_points: JSON.stringify([
      '用户目标：碎片化学习、考试、兴趣学习的差异',
      '学习机制：间隔复习、错题反馈、难度自适应',
      '激励体系：连胜、排行榜、宝石/体力与副作用',
      '内容供给：课程结构、题型、语音/口语能力覆盖',
      '商业模式：广告/订阅/家庭计划的价值锚点',
      '指标：7/30 日留存、学习时长、掌握度、课程完成率',
    ]),
  },
] as const;

function ensureTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS training_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      logo_url TEXT,
      prompt TEXT NOT NULL,
      industry TEXT NOT NULL,
      product_type TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'intermediate',
      reference_points TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
}

function seed() {
  ensureTables();
  const columns = sqlite.prepare(`PRAGMA table_info(training_questions)`).all() as Array<{ name: string }>;
  const hasLogo = columns.some((c) => c.name === 'logo_url');
  if (!hasLogo) {
    sqlite.exec(`ALTER TABLE training_questions ADD COLUMN logo_url TEXT`);
  }

  const stmt = sqlite.prepare(`
    INSERT INTO training_questions
    (question_key, title, logo_url, prompt, industry, product_type, difficulty, reference_points, is_active, updated_at)
    VALUES
    (@question_key, @title, @logo_url, @prompt, @industry, @product_type, @difficulty, @reference_points, 1, unixepoch())
    ON CONFLICT(question_key) DO UPDATE SET
      title=excluded.title,
      logo_url=excluded.logo_url,
      prompt=excluded.prompt,
      industry=excluded.industry,
      product_type=excluded.product_type,
      difficulty=excluded.difficulty,
      reference_points=excluded.reference_points,
      is_active=excluded.is_active,
      updated_at=excluded.updated_at
  `);

  const tx = sqlite.transaction(() => {
    for (const q of seedQuestions) {
      stmt.run({ ...q, logo_url: logoUrlFor(q.question_key) });
    }
  });

  tx();

  const count = sqlite.prepare(`SELECT COUNT(*) as c FROM training_questions`).get() as { c: number };
  console.log(`Seeded training_questions. Total: ${count.c}`);
}

seed();
