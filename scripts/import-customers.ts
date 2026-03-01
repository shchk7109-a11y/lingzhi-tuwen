import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const customers = [
  // 【类型1】职场精英型（10人）
  { name: "小陈不加班", nickname: "小陈不加班", gender: "女", age: 26, occupation: "互联网运营", city: "上海", income: "15-20K", category: "职场精英型", lifestyle: "晚睡晚起，经常凌晨1点后睡，愿意为健康花钱，月均养生产品500+", painPoints: "黑眼圈重、皮肤暗沉、容易疲劳", needs: "熬夜后补救，不想喝咖啡伤胃", scenes: "办公室下午茶、加班时", language: '口头禅：谁懂啊、绝了、家人们、真的栓Q；短句为主，情绪强烈，重度网络语', xhsAccount: "@小陈不加班" },
  { name: "Alex养生日记", nickname: "Alex养生日记", gender: "男", age: 32, occupation: "金融分析师", city: "深圳", income: "30-40K", category: "职场精英型", lifestyle: "规律，23:00前睡，6:30起，注重品质，不看价格看成分", painPoints: "工作压力大，需要提神不伤身", needs: "健身后补充，替代蛋白粉", scenes: "健身房后、周末午后", language: '口头禅：说实话、讲真、不吹不黑；理性分析型，条理清晰，轻度网络语', xhsAccount: "@Alex养生日记" },
  { name: "阿美的灵感罐", nickname: "阿美的灵感罐", gender: "女", age: 28, occupation: "UI设计师", city: "杭州", income: "18-25K", category: "职场精英型", lifestyle: "不规律，赶稿时通宵，颜值党，包装好看就买", painPoints: "久坐颈椎不好，眼睛疲劳", needs: "被包装设计吸引，拍照好看", scenes: "拍照打卡、工作时提神", language: '口头禅：这也太、救命、美哭了、挖到宝；感性描述，强调视觉感受，中度网络语', xhsAccount: "@阿美的灵感罐" },
  { name: "码农养生指南", nickname: "码农养生指南", gender: "男", age: 35, occupation: "后端开发", city: "北京", income: "40-50K", category: "职场精英型", lifestyle: "极不规律，经常凌晨还在改bug，实用主义，性价比优先", painPoints: "颈椎、腰椎、用眼过度", needs: "替代咖啡，减少心悸", scenes: "深夜coding时、debug间隙", language: '口头禅：实测、亲测有效、不整虚的；技术流，数据说话，分点论述，技术梗多', xhsAccount: "@码农养生指南" },
  { name: "Linda的职场生存法则", nickname: "Linda的职场生存法则", gender: "女", age: 38, occupation: "市场总监", city: "上海", income: "50K+", category: "职场精英型", lifestyle: "忙碌但规律，早起党，品牌意识强，只买对的", painPoints: "应酬多，需要护肝养胃", needs: "商务礼品，送客户送团队", scenes: "办公室、商务会议、送礼", language: '口头禅：从专业角度来说、我的经验是、建议；专业权威型，建议口吻，很少网络语', xhsAccount: "@Linda职场法则" },
  { name: "小北的产品笔记", nickname: "小北的产品笔记", gender: "男", age: 29, occupation: "产品经理", city: "成都", income: "20-25K", category: "职场精英型", lifestyle: "晚睡党，12点后睡，理性消费，喜欢对比评测", painPoints: "熬夜多、饮食不规律", needs: "解决熬夜后的身体不适", scenes: "加班时、周末宅家", language: '口头禅：从用户角度来说、痛点是、解决方案；产品思维，痛点-方案结构，中度网络语', xhsAccount: "@小北产品笔记" },
  { name: "HR姐姐的茶歇时间", nickname: "HR姐姐的茶歇时间", gender: "女", age: 33, occupation: "HR经理", city: "广州", income: "18-22K", category: "职场精英型", lifestyle: "规律，注重养生，喜欢团购，性价比+品质兼顾", painPoints: "久坐、空调房干燥", needs: "办公室养生，替代奶茶", scenes: "办公室下午茶、团建", language: '口头禅：姐妹们、安利给大家、亲测；亲切分享型，像邻居聊天，轻度网络语', xhsAccount: "@HR姐姐茶歇" },
  { name: "大刘的销售秘籍", nickname: "大刘的销售秘籍", gender: "男", age: 36, occupation: "销售总监", city: "深圳", income: "30-80K", category: "职场精英型", lifestyle: "应酬多，作息不规律，大手大脚，不太计较", painPoints: "喝酒多、胃不好", needs: "应酬后解酒护肝", scenes: "应酬后、见客户前", language: '口头禅：兄弟、说实话、不瞒你说；直爽型，不绕弯子，很少网络语', xhsAccount: "@大刘销售秘籍" },
  { name: "精打细算的喵", nickname: "精打细算的喵", gender: "女", age: 27, occupation: "财务专员", city: "苏州", income: "10-15K", category: "职场精英型", lifestyle: "规律，养生党，精打细算，等打折，小红书重度用户", painPoints: "久坐、眼睛疲劳", needs: "算过账，比奶茶划算还健康", scenes: "办公室、在家", language: '口头禅：算下来、性价比、薅到；算账型，数字说话，中度网络语', xhsAccount: "@精打细算的喵" },
  { name: "老周的创业日记", nickname: "老周的创业日记", gender: "男", age: 40, occupation: "创业公司CEO", city: "杭州", income: "不稳定", category: "职场精英型", lifestyle: "极不规律，随时在工作，该省省该花花", painPoints: "压力大、睡眠少", needs: "长期续航，保持精力", scenes: "办公室、开会、出差", language: '口头禅：从商业角度、我的经验、建议；经验分享型，有深度，很少网络语', xhsAccount: "@老周创业日记" },
  // 【类型2】精致妈妈型（10人）
  { name: "小雅育儿日记", nickname: "小雅育儿日记", gender: "女", age: 29, occupation: "全职妈妈（前设计师）", city: "南京", income: "家庭收入30K", category: "精致妈妈型", lifestyle: "跟着宝宝走，碎片化睡眠，宝宝第一，自己凑合", painPoints: "产后体虚、睡眠不足", needs: "产后恢复，补气养血", scenes: "宝宝午睡时、晚上哄睡后", language: '口头禅：宝妈、亲测、不踩雷、安利；经验分享型，详细具体，中度网络语', xhsAccount: "@小雅育儿日记" },
  { name: "莉莉的二胎生活", nickname: "莉莉的二胎生活", gender: "女", age: 34, occupation: "自由职业（自媒体）", city: "成都", income: "15-25K", category: "精致妈妈型", lifestyle: "忙碌但充实，早起，注重品质，性价比兼顾", painPoints: "精力不足、容易疲劳", needs: "保持精力，应对两个娃", scenes: "早上送娃后、工作间隙", language: '口头禅：姐妹们、带娃、实测、分享；生活记录型，真实感强，中度网络语', xhsAccount: "@莉莉二胎生活" },
  { name: "Karen的职场妈妈经", nickname: "Karen的职场妈妈经", gender: "女", age: 36, occupation: "外企经理", city: "上海", income: "40K+", category: "精致妈妈型", lifestyle: "高效管理，时间规划严格，品质优先，时间成本更贵", painPoints: "压力大、时间少", needs: "工作+带娃双重消耗，需要续航", scenes: "办公室、出差、加班", language: '口头禅：高效、平衡、我的经验、建议；方法论型，结构化分享，轻度网络语', xhsAccount: "@Karen职场妈妈" },
  { name: "小敏的母婴店", nickname: "小敏的母婴店", gender: "女", age: 31, occupation: "母婴店店主", city: "武汉", income: "20-30K", category: "精致妈妈型", lifestyle: "看店时间长，但相对自由，进货思维，关注成本和利润", painPoints: "久站、说话多嗓子累", needs: "自己先试用，效果好再上架", scenes: "看店时、招待客户", language: '口头禅：说实话、不坑人、良心推荐；实在型，接地气，轻度网络语', xhsAccount: "@小敏母婴店" },
  { name: "Maya瑜伽生活", nickname: "Maya瑜伽生活", gender: "女", age: 28, occupation: "瑜伽教练", city: "深圳", income: "15-25K", category: "精致妈妈型", lifestyle: "规律健康，早睡早起，健康投资不手软", painPoints: "用嗓多、体力消耗大", needs: "符合健康理念，天然草本", scenes: "课前准备、课后放松", language: '口头禅：身心平衡、自然、内在、能量；治愈系，强调身心感受，很少网络语', xhsAccount: "@Maya瑜伽生活" },
  { name: "圆圆的美食日记", nickname: "圆圆的美食日记", gender: "女", age: 30, occupation: "美食博主", city: "广州", income: "25-40K", category: "精致妈妈型", lifestyle: "不规律，探店时间不定，为内容投资，不计成本", painPoints: "吃太多需要调理", needs: "内容素材，健康饮品赛道", scenes: "探店时、拍摄间隙", language: '口头禅：绝了、好吃到哭、必须安利、冲鸭；种草型，强调体验感，重度网络语', xhsAccount: "@圆圆美食日记" },
  { name: "阿花的手作时光", nickname: "阿花的手作时光", gender: "女", age: 32, occupation: "手作工作室主理人", city: "厦门", income: "10-20K", category: "精致妈妈型", lifestyle: "自由，灵感来了就工作，喜欢小而美，支持原创", painPoints: "久坐、用眼疲劳", needs: "工作室饮品，招待客人", scenes: "做手工时、客人来访", language: '口头禅：慢慢来、用心、温暖、治愈；文艺型，情感细腻，很少网络语', xhsAccount: "@阿花手作时光" },
  { name: "护士小林的养生笔记", nickname: "护士小林的养生笔记", gender: "女", age: 27, occupation: "儿科护士", city: "杭州", income: "12-18K", category: "精致妈妈型", lifestyle: "三班倒，作息混乱，实用主义，医学背景理性", painPoints: "夜班伤身体、免疫力下降", needs: "夜班后调理，科学养生", scenes: "夜班时、下班后", language: '口头禅：从医学角度、建议、注意、科普；科普型，专业但易懂，很少网络语', xhsAccount: "@护士小林养生" },
  { name: "甜甜老师的日常", nickname: "甜甜老师的日常", gender: "女", age: 26, occupation: "幼儿园老师", city: "成都", income: "8-12K", category: "精致妈妈型", lifestyle: "规律，跟着学校时间，性价比优先，学生思维", painPoints: "用嗓过度、容易感冒", needs: "保护嗓子，工作需要", scenes: "课间、下班后", language: '口头禅：小朋友们、超可爱、分享、安利；活泼可爱型，亲和力强，中度网络语', xhsAccount: "@甜甜老师日常" },
  { name: "艾米产后修复", nickname: "艾米产后修复", gender: "女", age: 35, occupation: "产后修复师", city: "上海", income: "25-35K", category: "精致妈妈型", lifestyle: "预约制，时间相对灵活，专业投资，注重效果", painPoints: "工作累、需要保持精力", needs: "推荐给客户，自己先试用", scenes: "工作间隙、推荐给客户时", language: '口头禅：专业建议、恢复、调理、效果；专业建议型，有说服力，很少网络语', xhsAccount: "@艾米产后修复" },
  // 【类型3】学生党（10人）
  { name: "小北的考研日记", nickname: "小北的考研日记", gender: "男", age: 23, occupation: "大四考研党", city: "武汉", income: "生活费2K", category: "学生党", lifestyle: "图书馆作息，早起占座，精打细算，能省则省", painPoints: "久坐、眼睛疲劳、压力大", needs: "提神，比咖啡温和", scenes: "图书馆学习、熬夜复习", language: '口头禅：冲鸭、上岸、救命、卷；励志型，学习打卡，重度网络语', xhsAccount: "@小北考研日记" },
  { name: "Cindy留学日记", nickname: "Cindy留学日记", gender: "女", age: 24, occupation: "英国留学生", city: "伦敦", income: "家里给+兼职", category: "学生党", lifestyle: "时差党，偶尔熬夜，该省省该花花，喜欢国货", painPoints: "饮食不习惯、压力大", needs: "想喝国内味道，养生", scenes: "赶due时、想家时", language: '口头禅：想家、国内、安利、绝绝子；思乡型，对比中外，重度网络语', xhsAccount: "@Cindy留学日记" },
  { name: "阿杰的科研日常", nickname: "阿杰的科研日常", gender: "男", age: 25, occupation: "理工科研究生", city: "北京", income: "补助3K+导师补贴", category: "学生党", lifestyle: "实验室作息，看实验进度，理性，看成分和数据", painPoints: "久坐、熬夜、压力大", needs: "科研养生，数据说话", scenes: "实验室、写论文时", language: '口头禅：数据显示、实验证明、理性分析；科研型，逻辑清晰，轻度网络语', xhsAccount: "@阿杰科研日常" },
  { name: "小鹿的画室", nickname: "小鹿的画室", gender: "女", age: 22, occupation: "美院大四", city: "杭州", income: "兼职+生活费", category: "学生党", lifestyle: "创作型，深夜灵感多，画材花钱多，其他省", painPoints: "久坐、用眼疲劳", needs: "好看，拍照道具", scenes: "画画时、拍照", language: '口头禅：审美、氛围、绝了、美哭；文艺型，强调美感，中度网络语', xhsAccount: "@小鹿的画室" },
  { name: "大白的医学笔记", nickname: "大白的医学笔记", gender: "男", age: 24, occupation: "临床医学生", city: "南京", income: "实习补贴", category: "学生党", lifestyle: "医院实习，跟着排班，实用主义，医学背景", painPoints: "实习累、作息乱", needs: "医学认可，药食同源", scenes: "实习间隙、夜班", language: '口头禅：从医学角度、科普、注意、建议；科普型，专业但易懂，很少网络语', xhsAccount: "@大白医学笔记" },
  { name: "小法的法考之路", nickname: "小法的法考之路", gender: "女", age: 23, occupation: "法考备考生", city: "上海", income: "家里支持", category: "学生党", lifestyle: "备考作息，高强度学习，学习投资不手软", painPoints: "久坐、眼睛疲劳、压力大", needs: "提神，比咖啡温和", scenes: "自习室、图书馆", language: '口头禅：背不完、救命、上岸、坚持；励志型，学习打卡，中度网络语', xhsAccount: "@小法法考之路" },
  { name: "运动系学长", nickname: "运动系学长", gender: "男", age: 21, occupation: "体育专业大三", city: "广州", income: "生活费+兼职", category: "学生党", lifestyle: "训练作息，早起，注重运动营养", painPoints: "训练消耗大、恢复慢", needs: "运动后补充，天然无添加", scenes: "训练后、比赛前", language: '口头禅：冲、燃、干、实测；简短有力，运动风格，中度网络语', xhsAccount: "@运动系学长" },
  { name: "文学少女阿诗", nickname: "文学少女阿诗", gender: "女", age: 20, occupation: "中文系大二", city: "成都", income: "生活费", category: "学生党", lifestyle: "图书馆常客，喜欢读书写作，文艺消费倾向", painPoints: "久坐、用眼过度", needs: "读书时的伴侣饮品", scenes: "图书馆、宿舍写作时", language: '口头禅：岁月静好、温柔、治愈、美好；文学型，引用诗句，很少网络语', xhsAccount: "@文学少女阿诗" },
  { name: "创业系大学生小强", nickname: "创业系大学生小强", gender: "男", age: 22, occupation: "大学生创业者", city: "杭州", income: "创业收入不稳定", category: "学生党", lifestyle: "忙碌，创业+学业两头跑，理性消费", painPoints: "精力不足、压力大", needs: "保持精力，高效续航", scenes: "创业路演、熬夜工作", language: '口头禅：干货、复盘、迭代、增长；创业思维，目标导向，中度网络语', xhsAccount: "@创业系小强" },
  { name: "海归硕士小薇", nickname: "海归硕士小薇", gender: "女", age: 25, occupation: "海归求职中", city: "北京", income: "家里支持", category: "学生党", lifestyle: "求职压力大，生活精致，中西结合消费观", painPoints: "求职焦虑、睡眠质量差", needs: "调节状态，保持好气色", scenes: "面试前、求职间隙", language: '口头禅：真的绝了、安利、冲鸭、YYDS；中英混用，精致生活风，重度网络语', xhsAccount: "@海归硕士小薇" },
  // 【类型4】养生达人型（10人）
  { name: "中医粉丝团", nickname: "中医粉丝团", gender: "女", age: 45, occupation: "中学老师", city: "西安", income: "15-20K", category: "养生达人型", lifestyle: "规律，注重传统养生，中医爱好者", painPoints: "中年养生需求强烈", needs: "传统草本，药食同源", scenes: "早晨、晚上睡前", language: '口头禅：养生、调理、气血、平衡；传统养生型，引用中医理论，很少网络语', xhsAccount: "@中医粉丝团" },
  { name: "健身教练Tony", nickname: "健身教练Tony", gender: "男", age: 30, occupation: "健身教练", city: "北京", income: "20-35K", category: "养生达人型", lifestyle: "规律训练，注重营养，科学健身", painPoints: "训练强度大，需要恢复", needs: "天然补充，不影响训练", scenes: "训练后、客户指导时", language: '口头禅：科学、数据、效果、实测；专业健身型，数据说话，中度网络语', xhsAccount: "@健身教练Tony" },
  { name: "素食主义者小绿", nickname: "素食主义者小绿", gender: "女", age: 28, occupation: "环保NGO工作者", city: "北京", income: "12-18K", category: "养生达人型", lifestyle: "素食，环保，极简生活，关注可持续", painPoints: "素食营养不均衡", needs: "植物基，天然有机", scenes: "日常饮用、冥想时", language: '口头禅：天然、有机、可持续、爱地球；环保理念型，价值观驱动，轻度网络语', xhsAccount: "@素食主义小绿" },
  { name: "中年大叔爱养生", nickname: "中年大叔爱养生", gender: "男", age: 48, occupation: "企业高管", city: "北京", income: "80K+", category: "养生达人型", lifestyle: "应酬多，开始注重健康，有钱有闲", painPoints: "三高风险，需要调理", needs: "高端养生，送礼佳品", scenes: "商务场合、家庭养生", language: '口头禅：健康是本钱、调理、养生；稳重权威型，注重品质，很少网络语', xhsAccount: "@中年大叔养生" },
  { name: "跑步达人小跑", nickname: "跑步达人小跑", gender: "女", age: 35, occupation: "马拉松爱好者（会计）", city: "成都", income: "20-25K", category: "养生达人型", lifestyle: "早起跑步，规律作息，运动饮食结合", painPoints: "长跑后体力恢复", needs: "天然补充，不含激素", scenes: "跑步后、比赛前后", language: '口头禅：PB、配速、补给、冲鸭；运动达人型，分享跑步日常，中度网络语', xhsAccount: "@跑步达人小跑" },
  { name: "冥想老师云淡风轻", nickname: "云淡风轻", gender: "女", age: 40, occupation: "冥想导师", city: "大理", income: "15-30K", category: "养生达人型", lifestyle: "慢生活，冥想，身心灵修行", painPoints: "现代生活压力", needs: "身心平衡，天然草本", scenes: "冥想前后、日常修行", language: '口头禅：当下、觉知、平静、能量；灵性治愈型，哲学性语言，很少网络语', xhsAccount: "@云淡风轻冥想" },
  { name: "营养师小营", nickname: "营养师小营", gender: "女", age: 32, occupation: "注册营养师", city: "上海", income: "18-28K", category: "养生达人型", lifestyle: "科学饮食，规律作息，专业背景", painPoints: "专业人士更挑剔", needs: "成分科学，功效明确", scenes: "工作中推荐给客户", language: '口头禅：营养素、功效、建议、科学；专业科普型，数据支撑，轻度网络语', xhsAccount: "@营养师小营" },
  { name: "茶艺师阿茶", nickname: "茶艺师阿茶", gender: "男", age: 38, occupation: "茶艺师", city: "杭州", income: "15-25K", category: "养生达人型", lifestyle: "慢生活，品茶，传统文化爱好者", painPoints: "现代快节奏生活", needs: "草本茶饮，传统工艺", scenes: "茶室、客户接待", language: '口头禅：茶气、回甘、韵味、品味；传统茶文化型，文雅内敛，很少网络语', xhsAccount: "@茶艺师阿茶" },
  { name: "中医科医生李大夫", nickname: "李大夫健康说", gender: "男", age: 42, occupation: "中医科医生", city: "广州", income: "30-50K", category: "养生达人型", lifestyle: "规律，专业，注重科学与传统结合", painPoints: "工作压力大，久站", needs: "药食同源，科学验证", scenes: "工作间隙、推荐给患者", language: '口头禅：从中医角度、辨证施治、调理；专业权威型，中医理论，很少网络语', xhsAccount: "@李大夫健康说" },
  { name: "健康博主小健", nickname: "小健的健康笔记", gender: "男", age: 29, occupation: "健康类自媒体博主", city: "深圳", income: "20-50K", category: "养生达人型", lifestyle: "内容创作，研究健康产品，各平台活跃", painPoints: "需要持续输出优质内容", needs: "有故事有卖点的产品", scenes: "内容创作、产品测评", language: '口头禅：实测、亲测、安利、干货；种草测评型，内容丰富，重度网络语', xhsAccount: "@小健健康笔记" },
  // 【类型5】银发族（10人）
  { name: "退休阿姨王大妈", nickname: "王大妈养生日记", gender: "女", age: 58, occupation: "退休教师", city: "南京", income: "退休金5K", category: "银发族", lifestyle: "规律，广场舞，关注健康，子女孝顺", painPoints: "关节不好、睡眠质量差", needs: "子女推荐，老年养生", scenes: "早晨起床后、晚上睡前", language: '口头禅：对身体好、老年人、孩子说的；朴实亲切型，生活化语言，不用网络语', xhsAccount: "@王大妈养生" },
  { name: "老李头的茶时光", nickname: "老李头", gender: "男", age: 62, occupation: "退休工程师", city: "北京", income: "退休金6K", category: "银发族", lifestyle: "规律，喜欢喝茶，关注健康，技术思维", painPoints: "血压偏高、精力不足", needs: "草本调理，科学养生", scenes: "早晨、下午茶时间", language: '口头禅：实在、管用、不整虚的；朴实理性型，注重实效，不用网络语', xhsAccount: "@老李头茶时光" },
  { name: "广场舞冠军刘阿姨", nickname: "刘阿姨广场舞", gender: "女", age: 55, occupation: "退休会计", city: "成都", income: "退休金4K", category: "银发族", lifestyle: "活跃，广场舞，社交圈广，口碑传播", painPoints: "运动后体力恢复", needs: "活力满满，适合中老年", scenes: "广场舞后、日常饮用", language: '口头禅：好用、推荐、大家都说好；热情分享型，口碑传播，不用网络语', xhsAccount: "@刘阿姨广场舞" },
  { name: "孝顺儿子小明", nickname: "小明孝顺日记", gender: "男", age: 32, occupation: "公务员", city: "郑州", income: "15-20K", category: "银发族", lifestyle: "规律，孝顺，给父母买养生品", painPoints: "父母健康，孝心表达", needs: "给父母的礼物，安全天然", scenes: "节日送礼、日常孝顺", language: '口头禅：给爸妈、孝顺、安全、放心；孝顺型，情感驱动，轻度网络语', xhsAccount: "@小明孝顺日记" },
  { name: "夕阳红旅游达人", nickname: "夕阳红旅游", gender: "女", age: 60, occupation: "退休护士", city: "杭州", income: "退休金5K", category: "银发族", lifestyle: "旅游爱好者，活跃，关注健康旅行", painPoints: "旅途劳累，需要补充", needs: "便携养生，旅途伴侣", scenes: "旅行途中、景点游览", language: '口头禅：出去玩、方便、好带；活跃乐观型，旅游分享，不用网络语', xhsAccount: "@夕阳红旅游" },
  { name: "书法家老张", nickname: "老张书法养生", gender: "男", age: 65, occupation: "退休书法家", city: "西安", income: "退休金+书法收入", category: "银发族", lifestyle: "慢生活，书法，传统文化，养生", painPoints: "久坐、手腕疲劳", needs: "传统草本，文人养生", scenes: "书法练习时、品茶时", language: '口头禅：传统、文化、养生之道；文雅传统型，引用古语，不用网络语', xhsAccount: "@老张书法养生" },
  { name: "社区志愿者赵阿姨", nickname: "赵阿姨志愿者", gender: "女", age: 57, occupation: "退休社区工作者", city: "上海", income: "退休金4.5K", category: "银发族", lifestyle: "热心公益，社区活跃，口碑传播者", painPoints: "体力消耗大，需要补充", needs: "实惠好用，推荐给邻居", scenes: "志愿活动后、社区活动", language: '口头禅：大家都说好、推荐、实惠；热心肠型，社区传播，不用网络语', xhsAccount: "@赵阿姨志愿者" },
  { name: "钓鱼老伯陈叔", nickname: "陈叔钓鱼日记", gender: "男", age: 60, occupation: "退休厨师", city: "武汉", income: "退休金5K", category: "银发族", lifestyle: "钓鱼，户外，悠闲，注重实用", painPoints: "户外活动消耗大", needs: "方便携带，实用有效", scenes: "钓鱼时、户外活动", language: '口头禅：实在、管用、不整虚的；朴实实用型，注重效果，不用网络语', xhsAccount: "@陈叔钓鱼日记" },
  { name: "合唱团团长林奶奶", nickname: "林奶奶合唱团", gender: "女", age: 63, occupation: "退休音乐老师", city: "厦门", income: "退休金5K", category: "银发族", lifestyle: "合唱，音乐，社交活跃，嗓子保护", painPoints: "用嗓多，嗓子疲劳", needs: "保护嗓子，适合老年人", scenes: "排练前后、日常饮用", language: '口头禅：对嗓子好、推荐给团员、好喝；温和分享型，社区传播，不用网络语', xhsAccount: "@林奶奶合唱团" },
  { name: "太极拳师傅老武", nickname: "老武太极养生", gender: "男", age: 58, occupation: "太极拳教练", city: "成都", income: "15-20K", category: "银发族", lifestyle: "规律，太极，传统武术，养生哲学", painPoints: "关节保护，体力维持", needs: "传统养生，内外兼修", scenes: "晨练后、教学间隙", language: '口头禅：内外兼修、养生之道、传统；传统武术型，哲学性语言，不用网络语', xhsAccount: "@老武太极养生" },
]

async function main() {
  console.log('开始导入50个客户数据...')
  
  // 先清空现有客户数据
  await prisma.customer.deleteMany()
  
  for (const customer of customers) {
    await prisma.customer.create({ data: customer })
  }
  
  console.log(`✅ 成功导入 ${customers.length} 个客户`)
  
  // 导入默认提示词
  const prompts = [
    {
      key: 'cover_generation',
      name: '封面信息图生成',
      description: '用于生成小红书信息图封面的AI提示词',
      category: 'cover',
      content: `你是一位顶级小红书爆款内容策划师，专门制作具有强烈视觉冲击力的信息图封面。

【封面风格要求】
参考风格：奶油米白背景 + 手绘插画风 + 自然草本配色（深绿/琥珀/青绿/橙棕）
布局：竖版3:4比例，分为顶部标题区、中部主图区（用emoji代替）、底部信息图区

【标题要求】
- 主标题：8-15字，含感叹号，强情绪，可加引号强调关键词
- 公式选择：痛点+解决 / 数字+结果 / 反转惊喜 / 身份共鸣 / 悬念钩子
- 副标题：10-20字，补充说明，引导阅读

【信息图区域要求】
左栏：2个痛点/问题信息块，每块含标题+图标+说明
右栏：产品卖点区域，含亮点标题+三段式口感/效果描述+产品标签+对比表格

【JSON格式输出】
{
  "title": "主标题（8-15字，含感叹号，可含引号）",
  "subtitle": "副标题（10-20字）",
  "heroEmojis": ["主图emoji1", "主图emoji2", "主图emoji3"],
  "leftBlocks": [
    {"title": "痛点标题（4-8字）", "icon": "相关emoji", "detail": "解决说明（8-15字）", "color": "teal"},
    {"title": "痛点标题（4-8字）", "icon": "相关emoji", "detail": "解决说明（8-15字）", "color": "amber"}
  ],
  "rightSection": {
    "highlightTitle": "右栏核心亮点（4-8字）",
    "layers": [
      {"label": "第一层", "desc": "描述", "color": "green"},
      {"label": "第二层", "desc": "描述", "color": "amber"},
      {"label": "第三层", "desc": "描述", "color": "blue"}
    ],
    "techPoint": "核心技术/特色（6-12字）",
    "productName": "产品名称（4-8字）",
    "productSlogan": "卖点1|卖点2|卖点3"
  },
  "compareTable": [
    {"dimension": "对比维度", "before": "使用前/竞品", "after": "本产品"},
    {"dimension": "对比维度", "before": "使用前/竞品", "after": "本产品"},
    {"dimension": "对比维度", "before": "使用前/竞品", "after": "本产品"}
  ],
  "decorativeEmojis": ["装饰emoji1", "装饰emoji2", "装饰emoji3"],
  "sourceNote": "数据/资料来源说明",
  "tags": ["话题标签1", "话题标签2", "话题标签3", "话题标签4"]
}`
    },
    {
      key: 'content_clean',
      name: '文案去AI化二创',
      description: '将AI文案改写成自然真人风格，结合客户背景个性化',
      category: 'content',
      content: `你是一位文案去AI化专家，同时擅长根据用户画像进行个性化二次创作。

【检测维度】
感叹号密度、套路开头、完美结构、空泛形容词、过度正能量、标签堆砌、书面语过重、emoji滥用

【二创原则】
1. 结合客户的职业、年龄、语言风格进行个性化改写
2. 使用客户习惯的口头禅和表情符号
3. 加入客户真实生活场景和细节
4. 保留产品核心卖点，但用客户的语气表达

【输出JSON格式】
{
  "detection": {"issues": ["问题1", "问题2"]},
  "versions": {
    "light": "轻度清洗（保留结构，优化细节）",
    "medium": "中度清洗（打破结构，增加真实感）【推荐】",
    "heavy": "重度清洗（完全口语化，像朋友聊天）"
  },
  "recommended": "medium",
  "explanation": "修改说明",
  "checklist": {
    "likeFriendChat": true,
    "hasDetails": true,
    "hasEmotion": true,
    "hasColloquial": true,
    "hasRealFeel": true
  }
}`
    },
    {
      key: 'material_match',
      name: '素材智能匹配',
      description: '根据文案内容和客户背景，从素材库中匹配最合适的配图',
      category: 'material',
      content: `你是一位小红书内容策划师，需要根据文案内容和客户背景，从素材库中选择最合适的配图。

【匹配原则】
1. 第2张图：优先选择与文案场景最匹配的场景图（如职场人选办公室场景，妈妈选家庭场景）
2. 第3张图：优先选择配方图/原料图，展示产品成分和工艺
3. 同一产品线的图片优先级更高
4. 避免选择重复场景

【输出JSON格式】
{
  "image2": {"materialId": "素材ID", "reason": "选择理由"},
  "image3": {"materialId": "素材ID", "reason": "选择理由"}
}`
    },
  ]
  
  for (const prompt of prompts) {
    await prisma.prompt.upsert({
      where: { key: prompt.key },
      update: prompt,
      create: prompt,
    })
  }
  
  console.log('✅ 默认提示词导入完成')
  
  // 导入默认设置（管理员密码）
  await prisma.setting.upsert({
    where: { key: 'admin_password' },
    update: { value: 'lingzhi2024' },
    create: { key: 'admin_password', value: 'lingzhi2024' },
  })
  
  console.log('✅ 管理员密码设置完成（默认：lingzhi2024）')
}

main().catch(console.error).finally(() => prisma.$disconnect())
