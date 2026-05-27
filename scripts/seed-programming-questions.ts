/**
 * 编程知识题库种子脚本
 * 生成150+道标准化编程知识选择题，覆盖前端、后端、数据库三大领域
 * 运行命令: npx tsx scripts/seed-programming-questions.ts
 */

import { db } from "../lib/db/client";
import { programmingQuestions } from "../lib/db/schema";

// 难度分布: 初级30%, 中级50%, 高级20%
type Difficulty = "beginner" | "intermediate" | "advanced";

interface Question {
  questionKey: string;
  domain: string;
  category: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  links: string;
  difficulty: Difficulty;
}

// ==================== HTML/CSS基础 (html-css) ====================
const htmlCssQuestions: Question[] = [
  // 初级
  {
    questionKey: "html-001",
    domain: "frontend",
    category: "html-css",
    stem: "HTML5中，哪个标签用于定义文档的主要内容区域？",
    optionA: "<section>",
    optionB: "<main>",
    optionC: "<article>",
    optionD: "<div>",
    correctOption: "B",
    explanation: "<main>标签用于定义文档的主要内容区域，一个文档中只能有一个<main>元素，且不能是<article>、<aside>、<footer>、<header>、<nav>的后代。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/main",
    difficulty: "beginner"
  },
  {
    questionKey: "html-002",
    domain: "frontend",
    category: "html-css",
    stem: "CSS选择器优先级中，以下哪个权重最高？",
    optionA: "类选择器 (.class)",
    optionB: "ID选择器 (#id)",
    optionC: "元素选择器 (div)",
    optionD: "通用选择器 (*)",
    correctOption: "B",
    explanation: "CSS选择器优先级：内联样式(1000) > ID选择器(100) > 类/属性/伪类选择器(10) > 元素/伪元素选择器(1) > 通用选择器(0)。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/Specificity",
    difficulty: "beginner"
  },
  {
    questionKey: "html-003",
    domain: "frontend",
    category: "html-css",
    stem: "CSS盒模型中，width属性默认包含哪些部分？",
    optionA: "内容区 + 内边距 + 边框",
    optionB: "仅内容区",
    optionC: "内容区 + 内边距",
    optionD: "内容区 + 内边距 + 边框 + 外边距",
    correctOption: "B",
    explanation: "默认情况下(CSS box-sizing: content-box)，width只包含内容区宽度。使用box-sizing: border-box可以让width包含内容区+内边距+边框。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/box-sizing",
    difficulty: "beginner"
  },
  {
    questionKey: "html-004",
    domain: "frontend",
    category: "html-css",
    stem: "HTML5中，哪个属性用于为input元素提供输入提示？",
    optionA: "hint",
    optionB: "tip",
    optionC: "placeholder",
    optionD: "prompt",
    correctOption: "C",
    explanation: "placeholder属性用于在输入框为空时显示提示文本，当用户开始输入时会自动消失。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/input#placeholder",
    difficulty: "beginner"
  },
  {
    questionKey: "html-005",
    domain: "frontend",
    category: "html-css",
    stem: "在Flexbox布局中，哪个属性用于定义主轴方向？",
    optionA: "flex-wrap",
    optionB: "flex-direction",
    optionC: "justify-content",
    optionD: "align-items",
    correctOption: "B",
    explanation: "flex-direction定义主轴方向，可选值：row(水平)、row-reverse(水平反向)、column(垂直)、column-reverse(垂直反向)。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/flex-direction",
    difficulty: "beginner"
  },
  // 中级
  {
    questionKey: "html-006",
    domain: "frontend",
    category: "html-css",
    stem: "CSS Grid布局中，以下哪个属性用于定义网格区域的名称？",
    optionA: "grid-template-rows",
    optionB: "grid-template-areas",
    optionC: "grid-template-columns",
    optionD: "grid-area",
    correctOption: "B",
    explanation: "grid-template-areas用于定义网格区域的名称布局，通过字符串直观地表示网格结构，如'header header' 'sidebar main'。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/grid-template-areas",
    difficulty: "intermediate"
  },
  {
    questionKey: "html-007",
    domain: "frontend",
    category: "html-css",
    stem: "关于CSS定位，以下说法正确的是？",
    optionA: "position: relative会脱离文档流",
    optionB: "position: absolute相对于视口定位",
    optionC: "position: fixed相对于最近的定位祖先元素定位",
    optionD: "position: sticky在滚动到阈值前表现为relative，之后表现为fixed",
    correctOption: "D",
    explanation: "sticky定位是相对定位和固定定位的混合，在滚动到指定阈值前保持相对定位，之后变为固定定位。relative不脱离文档流，absolute相对于最近定位祖先，fixed相对于视口。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/position",
    difficulty: "intermediate"
  },
  {
    questionKey: "html-008",
    domain: "frontend",
    category: "html-css",
    stem: "CSS中，哪个伪类用于选择父元素的最后一个子元素？",
    optionA: ":last-child",
    optionB: ":last-of-type",
    optionC: ":nth-last-child(1)",
    optionD: "以上都可以",
    correctOption: "D",
    explanation: ":last-child选择最后一个子元素；:last-of-type选择同类型中的最后一个；:nth-last-child(1)从后往前数第一个。三者都可以选中最后一个子元素，但适用场景略有不同。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/:last-child",
    difficulty: "intermediate"
  },
  {
    questionKey: "html-009",
    domain: "frontend",
    category: "html-css",
    stem: "在Flexbox中，哪个属性用于控制子元素在交叉轴上的对齐方式？",
    optionA: "justify-content",
    optionB: "align-items",
    optionC: "align-content",
    optionD: "flex-align",
    correctOption: "B",
    explanation: "align-items控制单行子元素在交叉轴上的对齐；justify-content控制主轴对齐；align-content控制多行在交叉轴上的对齐。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/align-items",
    difficulty: "intermediate"
  },
  {
    questionKey: "html-010",
    domain: "frontend",
    category: "html-css",
    stem: "CSS变量（自定义属性）的语法正确的是？",
    optionA: "var --primary-color: blue;",
    optionB: "$primary-color: blue;",
    optionC: "--primary-color: blue;",
    optionD: "@primary-color: blue;",
    correctOption: "C",
    explanation: "CSS变量使用--前缀定义，如--primary-color: blue;，通过var()函数引用，如color: var(--primary-color);。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/--*",
    difficulty: "intermediate"
  },
  {
    questionKey: "html-011",
    domain: "frontend",
    category: "html-css",
    stem: "关于HTML5语义化标签，以下说法错误的是？",
    optionA: "<article>表示独立的、可分发内容",
    optionB: "<section>表示文档中的通用区块",
    optionC: "<div>是语义化标签，表示文档分区",
    optionD: "<aside>表示与主要内容间接相关的内容",
    correctOption: "C",
    explanation: "<div>是无语义的通用容器，仅用于布局分组。<section>、<article>、<aside>等都是HTML5引入的语义化标签。",
    links: "https://developer.mozilla.org/zh-CN/docs/Glossary/Semantics",
    difficulty: "intermediate"
  },
  // 高级
  {
    questionKey: "html-012",
    domain: "frontend",
    category: "html-css",
    stem: "CSS中，哪个属性可以创建新的层叠上下文？",
    optionA: "仅position: relative/absolute/fixed配合z-index",
    optionB: "opacity小于1、transform不为none、filter不为none等多种情况",
    optionC: "仅z-index属性",
    optionD: "仅position属性",
    correctOption: "B",
    explanation: "创建层叠上下文的情况包括：z-index不为auto的定位元素、opacity<1、transform不为none、filter不为none、mix-blend-mode不为normal、isolation: isolate等。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context",
    difficulty: "advanced"
  },
  {
    questionKey: "html-013",
    domain: "frontend",
    category: "html-css",
    stem: "关于CSS Grid的minmax()函数，以下说法正确的是？",
    optionA: "只能用于grid-template-rows",
    optionB: "定义了一个不小于最小值且不大于最大值的尺寸范围",
    optionC: "最大值必须大于最小值",
    optionD: "不能与fr单位一起使用",
    correctOption: "B",
    explanation: "minmax(min, max)定义尺寸范围，轨道尺寸至少为min，至多为max。可用于行列定义，可以与fr单位配合使用，如minmax(100px, 1fr)。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/minmax",
    difficulty: "advanced"
  },
  {
    questionKey: "html-014",
    domain: "frontend",
    category: "html-css",
    stem: "CSS中，关于contain属性的作用，以下说法正确的是？",
    optionA: "仅用于限制元素的宽度",
    optionB: "告诉浏览器该元素及其内容独立于文档其余部分，可进行优化",
    optionC: "仅用于创建新的BFC",
    optionD: "仅用于限制z-index的作用范围",
    correctOption: "B",
    explanation: "contain属性允许开发者告诉浏览器某元素及其内容与文档其他部分是独立的，浏览器可据此进行优化（如跳过不在视口内的元素重绘）。可选值：layout、paint、size、style等。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/contain",
    difficulty: "advanced"
  },
  {
    questionKey: "html-015",
    domain: "frontend",
    category: "html-css",
    stem: "关于CSS的@layer规则，以下说法正确的是？",
    optionA: "用于定义动画关键帧",
    optionB: "用于声明级联层，控制选择器优先级",
    optionC: "用于导入外部样式表",
    optionD: "用于定义媒体查询",
    correctOption: "B",
    explanation: "@layer用于声明级联层，允许开发者将CSS分组到不同的层中，层与层之间有明确的优先级顺序，解决了选择器优先级管理的问题。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/@layer",
    difficulty: "advanced"
  }
];

// ==================== JavaScript核心 (js) ====================
const jsQuestions: Question[] = [
  // 初级
  {
    questionKey: "js-001",
    domain: "frontend",
    category: "js",
    stem: "JavaScript中，以下哪个关键字用于声明块级作用域变量？",
    optionA: "var",
    optionB: "let",
    optionC: "function",
    optionD: "global",
    correctOption: "B",
    explanation: "let和const声明块级作用域变量，var声明函数作用域变量。const用于声明常量，let用于声明可变变量。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/let",
    difficulty: "beginner"
  },
  {
    questionKey: "js-002",
    domain: "frontend",
    category: "js",
    stem: "以下代码的输出是什么？console.log(typeof null);",
    optionA: '"null"',
    optionB: '"undefined"',
    optionC: '"object"',
    optionD: '"number"',
    correctOption: "C",
    explanation: "typeof null返回'object'是JavaScript的历史遗留bug，null实际上是一个原始值，不是对象。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/typeof",
    difficulty: "beginner"
  },
  {
    questionKey: "js-003",
    domain: "frontend",
    category: "js",
    stem: "JavaScript中，数组方法map()的作用是？",
    optionA: "过滤数组元素",
    optionB: "对数组每个元素执行函数并返回新数组",
    optionC: "查找数组元素",
    optionD: "对数组进行排序",
    correctOption: "B",
    explanation: "map()方法创建一个新数组，其结果是该数组中的每个元素调用一次提供的函数后的返回值。不会修改原数组。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/map",
    difficulty: "beginner"
  },
  {
    questionKey: "js-004",
    domain: "frontend",
    category: "js",
    stem: "以下哪个不是JavaScript的基本数据类型？",
    optionA: "string",
    optionB: "array",
    optionC: "boolean",
    optionD: "number",
    correctOption: "B",
    explanation: "JavaScript基本数据类型：string、number、boolean、null、undefined、symbol、bigint。array是对象类型，不是基本类型。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Data_structures",
    difficulty: "beginner"
  },
  {
    questionKey: "js-005",
    domain: "frontend",
    category: "js",
    stem: "JavaScript中，== 和 === 的区别是？",
    optionA: "没有区别",
    optionB: "==比较值，===比较值和类型",
    optionC: "==比较引用，===比较值",
    optionD: "==用于数字，===用于字符串",
    correctOption: "B",
    explanation: "==进行松散相等比较，会进行类型转换；===进行严格相等比较，要求值和类型都相同。推荐使用===避免意外类型转换。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Strict_equality",
    difficulty: "beginner"
  },
  // 中级
  {
    questionKey: "js-006",
    domain: "frontend",
    category: "js",
    stem: "以下代码的输出是什么？console.log(0.1 + 0.2 === 0.3);",
    optionA: "true",
    optionB: "false",
    optionC: "undefined",
    optionD: "报错",
    correctOption: "B",
    explanation: "由于浮点数精度问题，0.1 + 0.2实际上等于0.30000000000000004，不等于0.3。比较浮点数应使用误差范围。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON",
    difficulty: "intermediate"
  },
  {
    questionKey: "js-007",
    domain: "frontend",
    category: "js",
    stem: "关于JavaScript闭包，以下说法正确的是？",
    optionA: "闭包会导致内存泄漏，应避免使用",
    optionB: "闭包是函数和其词法环境的组合，可以访问外部作用域变量",
    optionC: "闭包只能在嵌套函数中创建",
    optionD: "闭包会复制外部变量到函数内部",
    correctOption: "B",
    explanation: "闭包是函数与其词法环境的组合，使函数可以访问其外部作用域中的变量。闭包是JavaScript的重要特性，合理使用不会导致问题。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Closures",
    difficulty: "intermediate"
  },
  {
    questionKey: "js-008",
    domain: "frontend",
    category: "js",
    stem: "JavaScript中，以下哪个方法可以创建对象的原型链继承？",
    optionA: "Object.assign()",
    optionB: "Object.create()",
    optionC: "Object.keys()",
    optionD: "Object.freeze()",
    correctOption: "B",
    explanation: "Object.create(proto)创建一个新对象，使用现有对象作为新对象的原型。这是实现原型继承的一种方式。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/create",
    difficulty: "intermediate"
  },
  {
    questionKey: "js-009",
    domain: "frontend",
    category: "js",
    stem: "关于JavaScript的this指向，以下说法正确的是？",
    optionA: "this总是指向函数定义时的对象",
    optionB: "this的指向在函数运行时确定，取决于调用方式",
    optionC: "箭头函数的this在定义时绑定，不能改变",
    optionD: "B和C都正确",
    correctOption: "D",
    explanation: "普通函数的this在运行时确定，取决于调用方式（默认绑定、隐式绑定、显式绑定、new绑定）。箭头函数的this在定义时继承外层作用域，且不能通过call/apply/bind改变。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/this",
    difficulty: "intermediate"
  },
  {
    questionKey: "js-010",
    domain: "frontend",
    category: "js",
    stem: "以下代码的输出顺序是？setTimeout(()=>console.log(1),0); Promise.resolve().then(()=>console.log(2)); console.log(3);",
    optionA: "1, 2, 3",
    optionB: "3, 2, 1",
    optionC: "3, 1, 2",
    optionD: "2, 3, 1",
    correctOption: "B",
    explanation: "执行顺序：同步代码(3) > 微任务Promise(2) > 宏任务setTimeout(1)。JavaScript事件循环中，微任务优先级高于宏任务。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Event_loop",
    difficulty: "intermediate"
  },
  {
    questionKey: "js-011",
    domain: "frontend",
    category: "js",
    stem: "JavaScript中，以下哪个不是创建Promise的方式？",
    optionA: "new Promise((resolve, reject) => {...})",
    optionB: "Promise.resolve(value)",
    optionC: "Promise.reject(reason)",
    optionD: "Promise.create(callback)",
    correctOption: "D",
    explanation: "Promise没有create静态方法。创建Promise的方式包括：new Promise构造器、Promise.resolve()、Promise.reject()、async函数返回值。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise",
    difficulty: "intermediate"
  },
  // 高级
  {
    questionKey: "js-012",
    domain: "frontend",
    category: "js",
    stem: "关于JavaScript的Event Loop，以下说法正确的是？",
    optionA: "所有异步任务都进入同一个队列",
    optionB: "宏任务包括setTimeout、setInterval、I/O操作，微任务包括Promise、MutationObserver",
    optionC: "微任务在每个宏任务之后执行",
    optionD: "B和C都正确",
    correctOption: "D",
    explanation: "事件循环中，宏任务和微任务分属不同队列。每次执行完一个宏任务后，会清空所有微任务，然后渲染，再执行下一个宏任务。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Event_loop",
    difficulty: "advanced"
  },
  {
    questionKey: "js-013",
    domain: "frontend",
    category: "js",
    stem: "以下代码的输出是什么？const obj = {a: 1}; console.log(obj.toString()); Object.prototype.toString = () => 'changed'; console.log(obj.toString());",
    optionA: '"[object Object]" "[object Object]"',
    optionB: '"[object Object]" "changed"',
    optionC: "报错",
    optionD: '"changed" "changed"',
    correctOption: "B",
    explanation: "第一次调用使用默认的Object.prototype.toString()返回'[object Object]'。修改原型方法后，第二次调用返回'changed'。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain",
    difficulty: "advanced"
  },
  {
    questionKey: "js-014",
    domain: "frontend",
    category: "js",
    stem: "关于JavaScript的Proxy和Reflect，以下说法正确的是？",
    optionA: "Proxy只能拦截对象属性的读取",
    optionB: "Proxy可以拦截对象的多种操作，Reflect提供默认行为",
    optionC: "Reflect是Proxy的别名",
    optionD: "Proxy会修改原对象",
    correctOption: "B",
    explanation: "Proxy用于创建对象的代理，可拦截get、set、has、deleteProperty等多种操作。Reflect提供与拦截器方法对应的默认行为，通常与Proxy配合使用。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy",
    difficulty: "advanced"
  },
  {
    questionKey: "js-015",
    domain: "frontend",
    category: "js",
    stem: "JavaScript中，以下哪个特性可以实现类的私有成员？",
    optionA: "使用下划线前缀命名约定",
    optionB: "使用Symbol作为属性键",
    optionC: "使用#前缀的私有字段",
    optionD: "使用WeakMap",
    correctOption: "C",
    explanation: "ES2022引入的私有字段使用#前缀，如#count，是真正的私有成员，外部无法访问。下划线只是约定，Symbol和WeakMap有一定封装效果但不是语言级别的私有。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes/Private_class_fields",
    difficulty: "advanced"
  },
  {
    questionKey: "js-016",
    domain: "frontend",
    category: "js",
    stem: "关于JavaScript的Generator函数，以下说法错误的是？",
    optionA: "Generator函数使用function*声明",
    optionB: "Generator函数返回一个可迭代对象",
    optionC: "yield*用于委托给另一个可迭代对象",
    optionD: "Generator函数不能使用return语句",
    correctOption: "D",
    explanation: "Generator函数可以使用return语句，return会结束迭代并返回指定值。function*声明，返回迭代器对象，yield*用于委托给其他生成器或可迭代对象。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/function*",
    difficulty: "advanced"
  }
];

// ==================== 前端框架 (framework) ====================
const frameworkQuestions: Question[] = [
  // 初级
  {
    questionKey: "fw-001",
    domain: "frontend",
    category: "framework",
    stem: "React中，用于在组件间传递数据的机制是？",
    optionA: "Services",
    optionB: "Props",
    optionC: "Modules",
    optionD: "Controllers",
    correctOption: "B",
    explanation: "Props（Properties）是React中父组件向子组件传递数据的方式，是只读的。数据通过props自上而下流动。",
    links: "https://react.dev/learn/thinking-in-react#step-2-build-a-static-version-in-react",
    difficulty: "beginner"
  },
  {
    questionKey: "fw-002",
    domain: "frontend",
    category: "framework",
    stem: "Vue.js中，用于双向数据绑定的指令是？",
    optionA: "v-bind",
    optionB: "v-model",
    optionC: "v-on",
    optionD: "v-if",
    correctOption: "B",
    explanation: "v-model指令在表单元素上创建双向数据绑定，自动处理输入事件和值更新。v-bind是单向绑定，v-on绑定事件。",
    links: "https://vuejs.org/guide/essentials/forms.html",
    difficulty: "beginner"
  },
  {
    questionKey: "fw-003",
    domain: "frontend",
    category: "framework",
    stem: "React中，useState Hook返回的是什么？",
    optionA: "仅当前状态值",
    optionB: "状态值和更新函数的数组",
    optionC: "仅更新函数",
    optionD: "Promise对象",
    correctOption: "B",
    explanation: "useState返回一个数组，包含两个元素：当前状态值和更新函数。通常使用解构赋值：const [count, setCount] = useState(0)。",
    links: "https://react.dev/reference/react/useState",
    difficulty: "beginner"
  },
  {
    questionKey: "fw-004",
    domain: "frontend",
    category: "framework",
    stem: "Angular中，用于定义组件装饰器的是？",
    optionA: "@Component",
    optionB: "@NgModule",
    optionC: "@Injectable",
    optionD: "@Directive",
    correctOption: "A",
    explanation: "@Component装饰器用于定义组件，包含selector、template/templateUrl、styles/styleUrls等元数据。@NgModule定义模块，@Injectable定义服务。",
    links: "https://angular.io/guide/component-overview",
    difficulty: "beginner"
  },
  {
    questionKey: "fw-005",
    domain: "frontend",
    category: "framework",
    stem: "Vue 3中，用于创建响应式对象的API是？",
    optionA: "Vue.observable()",
    optionB: "reactive()",
    optionC: "watch()",
    optionD: "computed()",
    correctOption: "B",
    explanation: "Vue 3的Composition API中，reactive()用于创建响应式对象，ref()用于创建响应式基本值。Vue.observable()是Vue 2的API。",
    links: "https://vuejs.org/guide/essentials/reactivity-fundamentals.html",
    difficulty: "beginner"
  },
  // 中级
  {
    questionKey: "fw-006",
    domain: "frontend",
    category: "framework",
    stem: "React中，useEffect Hook的依赖数组为空数组[]时表示？",
    optionA: "每次渲染都执行",
    optionB: "仅在组件挂载时执行",
    optionC: "仅在组件卸载时执行",
    optionD: "从不执行",
    correctOption: "B",
    explanation: "useEffect的依赖数组为[]时，副作用只在组件挂载时执行一次，类似于componentDidMount。返回的清理函数在卸载时执行。",
    links: "https://react.dev/reference/react/useEffect",
    difficulty: "intermediate"
  },
  {
    questionKey: "fw-007",
    domain: "frontend",
    category: "framework",
    stem: "Vue中，computed和methods的区别是？",
    optionA: "没有区别，可以互换使用",
    optionB: "computed有缓存，依赖不变不重新计算；methods每次调用都执行",
    optionC: "computed可以传参，methods不能传参",
    optionD: "computed用于异步操作，methods用于同步操作",
    correctOption: "B",
    explanation: "computed属性基于依赖缓存，只有依赖变化时才重新计算；methods每次调用都执行函数。computed适合计算属性，methods适合事件处理。",
    links: "https://vuejs.org/guide/essentials/computed.html",
    difficulty: "intermediate"
  },
  {
    questionKey: "fw-008",
    domain: "frontend",
    category: "framework",
    stem: "React中，关于Context API的作用，以下说法正确的是？",
    optionA: "用于替代所有props传递",
    optionB: "用于跨层级组件共享数据，避免prop drilling",
    optionC: "用于替代Redux的所有功能",
    optionD: "仅用于主题切换",
    correctOption: "B",
    explanation: "Context API提供了一种在组件树中传递数据的方式，无需逐层传递props。适合共享全局数据如主题、用户信息等，但不适合所有场景。",
    links: "https://react.dev/reference/react/useContext",
    difficulty: "intermediate"
  },
  {
    questionKey: "fw-009",
    domain: "frontend",
    category: "framework",
    stem: "Angular中，依赖注入(DI)的核心装饰器是？",
    optionA: "@Component",
    optionB: "@Injectable",
    optionC: "@NgModule",
    optionD: "@Input",
    correctOption: "B",
    explanation: "@Injectable装饰器标记一个类可以被依赖注入系统使用。服务通常使用@Injectable，使其可以在组件或其他服务中注入。",
    links: "https://angular.io/guide/dependency-injection",
    difficulty: "intermediate"
  },
  {
    questionKey: "fw-010",
    domain: "frontend",
    category: "framework",
    stem: "Vue 3的Composition API相比Options API的优势不包括？",
    optionA: "更好的逻辑复用",
    optionB: "更灵活的代码组织",
    optionC: "更好的TypeScript支持",
    optionD: "更高的运行时性能",
    correctOption: "D",
    explanation: "Composition API的优势包括逻辑复用（通过组合函数）、灵活的代码组织、更好的TypeScript支持。但运行时性能与Options API相当，不是主要优势。",
    links: "https://vuejs.org/guide/extras/composition-api-faq.html",
    difficulty: "intermediate"
  },
  // 高级
  {
    questionKey: "fw-011",
    domain: "frontend",
    category: "framework",
    stem: "React中，关于React.memo的作用，以下说法正确的是？",
    optionA: "用于记忆化函数组件，避免不必要的重渲染",
    optionB: "用于创建不可变状态",
    optionC: "用于优化Hook性能",
    optionD: "用于替代shouldComponentUpdate",
    correctOption: "A",
    explanation: "React.memo是高阶组件，对函数组件进行浅比较，props不变时跳过渲染。类似于类组件的PureComponent。可以配合useMemo、useCallback使用。",
    links: "https://react.dev/reference/react/memo",
    difficulty: "advanced"
  },
  {
    questionKey: "fw-012",
    domain: "frontend",
    category: "framework",
    stem: "Vue 3中，关于Proxy替代Object.defineProperty的优势，以下说法错误的是？",
    optionA: "可以监听新增和删除的属性",
    optionB: "可以监听数组索引的变化",
    optionC: "Proxy兼容性更好，支持IE11",
    optionD: "Proxy性能更好",
    correctOption: "C",
    explanation: "Proxy的优势包括监听新增/删除属性、数组索引变化、Map/Set等。但Proxy不兼容IE11，这是Vue 3放弃IE支持的原因之一。",
    links: "https://vuejs.org/guide/extras/reactivity-in-depth.html",
    difficulty: "advanced"
  },
  {
    questionKey: "fw-013",
    domain: "frontend",
    category: "framework",
    stem: "React 18中，Concurrent Features的核心机制是？",
    optionA: "Fiber架构",
    optionB: "Suspense和Transitions",
    optionC: "Hooks",
    optionD: "Context API",
    correctOption: "B",
    explanation: "React 18的并发特性基于Suspense（异步组件加载）和Transitions（可中断更新）。Fiber架构是实现基础，Hooks和Context是已有特性。",
    links: "https://react.dev/blog/2022/03/29/react-v18",
    difficulty: "advanced"
  },
  {
    questionKey: "fw-014",
    domain: "frontend",
    category: "framework",
    stem: "Angular中，关于变更检测策略OnPush的说法正确的是？",
    optionA: "每次事件都触发检测",
    optionB: "仅在输入属性变化时触发检测",
    optionC: "禁用变更检测",
    optionD: "仅检测DOM事件",
    correctOption: "B",
    explanation: "OnPush策略下，组件仅在@Input属性引用变化、组件或其子组件触发事件、使用async pipe时进行变更检测。可显著提升性能。",
    links: "https://angular.io/guide/change-detection-skipping-subtrees",
    difficulty: "advanced"
  },
  {
    questionKey: "fw-015",
    domain: "frontend",
    category: "framework",
    stem: "关于前端框架的虚拟DOM，以下说法正确的是？",
    optionA: "虚拟DOM比真实DOM操作更快",
    optionB: "虚拟DOM通过Diff算法最小化真实DOM操作",
    optionC: "所有现代框架都使用虚拟DOM",
    optionD: "虚拟DOM消除了DOM操作的性能问题",
    correctOption: "B",
    explanation: "虚拟DOM本身不是更快，而是通过Diff算法找出最小变更集，批量更新真实DOM。Svelte等框架不使用虚拟DOM而是编译时优化。虚拟DOM不能消除所有性能问题。",
    links: "https://react.dev/learn/render-and-commit",
    difficulty: "advanced"
  }
];

// ==================== 浏览器原理 (browser) ====================
const browserQuestions: Question[] = [
  // 初级
  {
    questionKey: "br-001",
    domain: "frontend",
    category: "browser",
    stem: "浏览器的本地存储中，哪种存储方式有大小限制且数据不会随会话结束而清除？",
    optionA: "sessionStorage",
    optionB: "localStorage",
    optionC: "cookie",
    optionD: "cacheStorage",
    correctOption: "B",
    explanation: "localStorage存储持久化数据，除非手动清除否则不会过期，通常限制5-10MB。sessionStorage随会话结束清除，cookie通常限制4KB。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/API/Window/localStorage",
    difficulty: "beginner"
  },
  {
    questionKey: "br-002",
    domain: "frontend",
    category: "browser",
    stem: "浏览器渲染页面时，DOM和CSSOM合并后形成什么？",
    optionA: "JavaScript引擎",
    optionB: "Render Tree（渲染树）",
    optionC: "HTTP请求",
    optionD: "WebSocket",
    correctOption: "B",
    explanation: "浏览器将HTML解析为DOM，CSS解析为CSSOM，两者合并形成Render Tree（渲染树），然后计算布局并绘制到屏幕。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/Performance/How_browsers_work",
    difficulty: "beginner"
  },
  {
    questionKey: "br-003",
    domain: "frontend",
    category: "browser",
    stem: "JavaScript中，哪个对象用于操作浏览器历史记录？",
    optionA: "location",
    optionB: "history",
    optionC: "navigator",
    optionD: "screen",
    correctOption: "B",
    explanation: "history对象提供操作浏览器会话历史的能力，包括back()、forward()、go()、pushState()、replaceState()等方法。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/API/History",
    difficulty: "beginner"
  },
  {
    questionKey: "br-004",
    domain: "frontend",
    category: "browser",
    stem: "浏览器中，哪个API用于发起HTTP请求？",
    optionA: "WebSocket",
    optionB: "Fetch API / XMLHttpRequest",
    optionC: "IndexedDB",
    optionD: "Service Worker",
    correctOption: "B",
    explanation: "Fetch API和XMLHttpRequest(XHR)用于发起HTTP请求。Fetch是现代标准API，返回Promise；XHR是较老的API。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API",
    difficulty: "beginner"
  },
  {
    questionKey: "br-005",
    domain: "frontend",
    category: "browser",
    stem: "关于浏览器缓存，Cache-Control: no-cache的含义是？",
    optionA: "不使用任何缓存",
    optionB: "使用缓存前必须向服务器验证",
    optionC: "仅缓存到内存",
    optionD: "缓存永不过期",
    correctOption: "B",
    explanation: "no-cache表示可以使用缓存，但必须先向服务器验证资源是否变化（发送条件请求）。不使用缓存的是no-store。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control",
    difficulty: "beginner"
  },
  // 中级
  {
    questionKey: "br-006",
    domain: "frontend",
    category: "browser",
    stem: "浏览器的事件循环中，宏任务(MacroTask)包括？",
    optionA: "Promise.then",
    optionB: "setTimeout、setInterval、I/O、UI渲染",
    optionC: "queueMicrotask",
    optionD: "MutationObserver",
    correctOption: "B",
    explanation: "宏任务包括setTimeout、setInterval、setImmediate(Node)、I/O操作、UI渲染等。Promise.then、queueMicrotask、MutationObserver是微任务。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Event_loop",
    difficulty: "intermediate"
  },
  {
    questionKey: "br-007",
    domain: "frontend",
    category: "browser",
    stem: "关于浏览器重绘(Repaint)和重排(Reflow)，以下说法正确的是？",
    optionA: "修改元素颜色会触发重排",
    optionB: "修改元素尺寸会触发重排，重排必定触发重绘",
    optionC: "重绘比重排性能开销更大",
    optionD: "两者没有区别",
    correctOption: "B",
    explanation: "重排(Reflow)是几何属性变化导致重新计算布局，如尺寸、位置变化。重绘(Repaint)是外观变化不影响布局，如颜色。重排必定触发重绘，开销更大。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/Performance/How_browsers_work",
    difficulty: "intermediate"
  },
  {
    questionKey: "br-008",
    domain: "frontend",
    category: "browser",
    stem: "Service Worker的主要功能不包括？",
    optionA: "离线缓存",
    optionB: "后台同步",
    optionC: "推送通知",
    optionD: "修改DOM",
    correctOption: "D",
    explanation: "Service Worker是运行在后台的脚本，可拦截网络请求、实现离线缓存、后台同步、推送通知。但它在独立线程运行，无法直接访问DOM。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API",
    difficulty: "intermediate"
  },
  {
    questionKey: "br-009",
    domain: "frontend",
    category: "browser",
    stem: "关于浏览器同源策略(Same-Origin Policy)，以下说法正确的是？",
    optionA: "阻止所有跨域请求",
    optionB: "限制不同源文档间的数据访问，但可通过CORS放宽",
    optionC: "仅限制JavaScript访问",
    optionD: "仅限制Cookie访问",
    correctOption: "B",
    explanation: "同源策略限制不同源（协议、域名、端口不同）的文档或脚本间的数据访问，防止安全威胁。CORS机制允许服务器声明哪些源可以访问资源。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy",
    difficulty: "intermediate"
  },
  {
    questionKey: "br-010",
    domain: "frontend",
    category: "browser",
    stem: "浏览器解析HTML时，遇到<script>标签默认会？",
    optionA: "异步下载并执行",
    optionB: "暂停HTML解析，下载并执行脚本后再继续",
    optionC: "忽略脚本继续解析",
    optionD: "仅下载不执行",
    correctOption: "B",
    explanation: "默认情况下，浏览器遇到<script>会阻塞HTML解析，下载并执行脚本后再继续解析。使用async属性可异步下载并在下载完成后执行；defer异步下载并在HTML解析完成后执行。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script",
    difficulty: "intermediate"
  },
  // 高级
  {
    questionKey: "br-011",
    domain: "frontend",
    category: "browser",
    stem: "关于浏览器的渲染优化，以下说法正确的是？",
    optionA: "频繁读取offsetHeight不会触发重排",
    optionB: "使用requestAnimationFrame可以将动画与显示器刷新率同步",
    optionC: "使用DocumentFragment对性能没有帮助",
    optionD: "强制同步布局(Forced Synchronous Layout)不会影响性能",
    correctOption: "B",
    explanation: "requestAnimationFrame将动画回调安排在下次重绘前执行，与显示器刷新率（通常60Hz）同步。频繁读取布局属性会触发强制同步布局，影响性能。DocumentFragment可减少DOM操作次数。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/API/window/requestAnimationFrame",
    difficulty: "advanced"
  },
  {
    questionKey: "br-012",
    domain: "frontend",
    category: "browser",
    stem: "关于V8引擎的隐藏类(Hidden Class)和内联缓存(Inline Cache)，以下说法正确的是？",
    optionA: "隐藏类用于存储JavaScript源码",
    optionB: "隐藏类用于优化对象属性访问，内联缓存加速属性查找",
    optionC: "内联缓存用于缓存HTML页面",
    optionD: "隐藏类仅在开发模式使用",
    correctOption: "B",
    explanation: "V8使用隐藏类表示对象结构，相同形状的对象共享隐藏类，加速属性访问。内联缓存(IC)缓存属性查找结果，避免重复查找，是V8优化的关键机制。",
    links: "https://v8.dev/docs/hidden-classes",
    difficulty: "advanced"
  },
  {
    questionKey: "br-013",
    domain: "frontend",
    category: "browser",
    stem: "关于浏览器的关键渲染路径优化，以下说法错误的是？",
    optionA: "CSS会阻塞渲染，应放在头部尽早加载",
    optionB: "JavaScript会阻塞解析，可使用async/defer优化",
    optionC: "首屏内容所需的CSS可以内联到HTML中",
    optionD: "所有资源都应该预加载(prefetch)",
    correctOption: "D",
    explanation: "预加载所有资源会造成带宽浪费和竞争。应优先加载关键资源，非关键资源延迟加载。关键CSS可内联，JS使用async/defer，图片懒加载等。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/Performance/Critical_rendering_path",
    difficulty: "advanced"
  },
  {
    questionKey: "br-014",
    domain: "frontend",
    category: "browser",
    stem: "关于Web Workers，以下说法正确的是？",
    optionA: "Web Workers可以访问DOM",
    optionB: "Web Workers在独立线程运行，通过消息传递与主线程通信",
    optionC: "Web Workers与主线程共享内存",
    optionD: "一个页面只能创建一个Worker",
    correctOption: "B",
    explanation: "Web Workers在后台线程运行JavaScript，不阻塞主线程。Worker无法访问DOM，通过postMessage/onmessage与主线程通信。SharedWorker可被多个页面共享。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API",
    difficulty: "advanced"
  },
  {
    questionKey: "br-015",
    domain: "frontend",
    category: "browser",
    stem: "关于浏览器资源提示(Resource Hints)，以下说法正确的是？",
    optionA: "preload和prefetch作用相同",
    optionB: "preload用于当前页面必需资源，prefetch用于未来可能需要的资源",
    optionC: "preconnect用于预渲染页面",
    optionD: "dns-prefetch用于预加载脚本",
    correctOption: "B",
    explanation: "preload声明当前页面必需资源，高优先级获取；prefetch声明未来可能需要的资源，低优先级空闲时获取；preconnect预先建立连接；dns-prefetch预先解析DNS。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/Performance/Resource_hints",
    difficulty: "advanced"
  }
];

// ==================== 服务器概念 (server) ====================
const serverQuestions: Question[] = [
  // 初级
  {
    questionKey: "sv-001",
    domain: "backend",
    category: "server",
    stem: "以下哪种服务器类型主要用于处理HTTP请求和提供Web内容？",
    optionA: "FTP服务器",
    optionB: "Web服务器",
    optionC: "邮件服务器",
    optionD: "DNS服务器",
    correctOption: "B",
    explanation: "Web服务器（如Nginx、Apache）专门处理HTTP/HTTPS请求，提供网页内容。FTP用于文件传输，DNS用于域名解析，邮件服务器处理邮件。",
    links: "https://developer.mozilla.org/zh-CN/docs/Learn/Common_questions/What_is_a_web_server",
    difficulty: "beginner"
  },
  {
    questionKey: "sv-002",
    domain: "backend",
    category: "server",
    stem: "常见的Web服务器软件不包括？",
    optionA: "Nginx",
    optionB: "Apache",
    optionC: "MySQL",
    optionD: "IIS",
    correctOption: "C",
    explanation: "MySQL是数据库管理系统，不是Web服务器。Nginx、Apache、IIS（Internet Information Services）都是常见的Web服务器软件。",
    links: "https://developer.mozilla.org/zh-CN/docs/Learn/Common_questions/What_is_a_web_server",
    difficulty: "beginner"
  },
  {
    questionKey: "sv-003",
    domain: "backend",
    category: "server",
    stem: "负载均衡(Load Balancing)的主要作用是？",
    optionA: "增加服务器存储容量",
    optionB: "将流量分发到多台服务器，提高可用性和性能",
    optionC: "加速数据库查询",
    optionD: "压缩传输数据",
    correctOption: "B",
    explanation: "负载均衡将传入的网络流量分发到多台服务器，避免单点故障，提高系统可用性、可扩展性和响应速度。",
    links: "https://www.nginx.com/resources/glossary/load-balancing/",
    difficulty: "beginner"
  },
  {
    questionKey: "sv-004",
    domain: "backend",
    category: "server",
    stem: "服务器集群(Cluster)的主要优势是？",
    optionA: "降低硬件成本",
    optionB: "提高可用性、可扩展性和容错能力",
    optionC: "简化代码开发",
    optionD: "减少网络延迟",
    correctOption: "B",
    explanation: "服务器集群通过多台服务器协同工作，提供高可用性（故障转移）、水平扩展（增加节点）和容错能力。",
    links: "https://en.wikipedia.org/wiki/Computer_cluster",
    difficulty: "beginner"
  },
  {
    questionKey: "sv-005",
    domain: "backend",
    category: "server",
    stem: "反向代理(Reverse Proxy)的主要功能不包括？",
    optionA: "负载均衡",
    optionB: "SSL终端",
    optionC: "缓存静态内容",
    optionD: "直接处理数据库查询",
    correctOption: "D",
    explanation: "反向代理位于服务器前端，功能包括负载均衡、SSL终端、缓存、安全防护等。不直接处理数据库查询，这是应用服务器或数据库的工作。",
    links: "https://www.nginx.com/resources/glossary/reverse-proxy-server/",
    difficulty: "beginner"
  },
  // 中级
  {
    questionKey: "sv-006",
    domain: "backend",
    category: "server",
    stem: "关于服务器无状态(Stateless)设计，以下说法正确的是？",
    optionA: "服务器不存储任何数据",
    optionB: "每个请求包含所有必要信息，服务器不保存客户端会话状态",
    optionC: "服务器不处理业务逻辑",
    optionD: "服务器不使用数据库",
    correctOption: "B",
    explanation: "无状态设计指服务器不保存客户端的会话状态，每个请求必须包含所有必要信息。这简化了服务器设计，便于水平扩展。",
    links: "https://restfulapi.net/statelessness/",
    difficulty: "intermediate"
  },
  {
    questionKey: "sv-007",
    domain: "backend",
    category: "server",
    stem: "CDN(Content Delivery Network)的主要作用是？",
    optionA: "加速数据库查询",
    optionB: "通过分布式节点缓存和分发内容，降低延迟",
    optionC: "提供服务器安全防护",
    optionD: "替代源服务器存储数据",
    correctOption: "B",
    explanation: "CDN通过在全球分布的边缘节点缓存静态内容，让用户从最近节点获取资源，显著降低延迟，减轻源服务器压力。",
    links: "https://developer.mozilla.org/zh-CN/docs/Glossary/CDN",
    difficulty: "intermediate"
  },
  {
    questionKey: "sv-008",
    domain: "backend",
    category: "server",
    stem: "服务器性能优化中，水平扩展(Scale Out)和垂直扩展(Scale Up)的区别是？",
    optionA: "水平扩展增加服务器数量，垂直扩展提升单机性能",
    optionB: "水平扩展提升单机性能，垂直扩展增加服务器数量",
    optionC: "两者没有区别",
    optionD: "水平扩展仅用于数据库",
    correctOption: "A",
    explanation: "水平扩展(Scale Out)通过增加更多服务器节点扩展容量；垂直扩展(Scale Up)通过升级现有服务器硬件（CPU、内存）提升性能。",
    links: "https://en.wikipedia.org/wiki/Scalability",
    difficulty: "intermediate"
  },
  {
    questionKey: "sv-009",
    domain: "backend",
    category: "server",
    stem: "微服务架构相比单体架构的优势不包括？",
    optionA: "独立部署和扩展",
    optionB: "技术栈多样性",
    optionC: "更简单的系统复杂度",
    optionD: "故障隔离",
    correctOption: "C",
    explanation: "微服务优势包括独立部署扩展、技术栈灵活、故障隔离。但分布式系统带来更高复杂度（网络延迟、数据一致性、运维难度）。",
    links: "https://martinfowler.com/articles/microservices.html",
    difficulty: "intermediate"
  },
  {
    questionKey: "sv-010",
    domain: "backend",
    category: "server",
    stem: "服务器容灾中的RTO和RPO分别指？",
    optionA: "RTO=恢复时间目标，RPO=恢复点目标",
    optionB: "RTO=恢复点目标，RPO=恢复时间目标",
    optionC: "RTO=请求超时，RPO=响应超时",
    optionD: "RTO=读取超时，RPO=写入超时",
    correctOption: "A",
    explanation: "RTO(Recovery Time Objective)是恢复时间目标，指故障后恢复服务的最长时间；RPO(Recovery Point Objective)是恢复点目标，指可接受的数据丢失量。",
    links: "https://en.wikipedia.org/wiki/Disaster_recovery",
    difficulty: "intermediate"
  },
  // 高级
  {
    questionKey: "sv-011",
    domain: "backend",
    category: "server",
    stem: "关于服务器连接池(Connection Pool)，以下说法正确的是？",
    optionA: "连接池会增加服务器负担，应避免使用",
    optionB: "连接池复用已有连接，减少连接建立开销",
    optionC: "连接池仅用于HTTP连接",
    optionD: "连接池会无限创建连接",
    correctOption: "B",
    explanation: "连接池维护一组可复用的连接，避免频繁创建/销毁连接的开销，提高性能。常用于数据库连接、HTTP连接等，有最大连接数限制。",
    links: "https://en.wikipedia.org/wiki/Connection_pool",
    difficulty: "advanced"
  },
  {
    questionKey: "sv-012",
    domain: "backend",
    category: "server",
    stem: "关于服务器限流(Rate Limiting)算法，以下说法错误的是？",
    optionA: "令牌桶算法允许突发流量",
    optionB: "漏桶算法平滑输出流量",
    optionC: "固定窗口算法在窗口边界可能出现双倍流量",
    optionD: "滑动窗口算法不需要记录请求时间",
    correctOption: "D",
    explanation: "滑动窗口算法需要记录每个请求的时间戳来计算当前窗口内的请求数。令牌桶允许突发，漏桶平滑流量，固定窗口在边界可能有问题。",
    links: "https://en.wikipedia.org/wiki/Rate_limiting",
    difficulty: "advanced"
  },
  {
    questionKey: "sv-013",
    domain: "backend",
    category: "server",
    stem: "服务器高可用架构中的CAP定理指？",
    optionA: "一致性、可用性、分区容错性，三者不可兼得",
    optionB: "计算、存储、网络",
    optionC: "客户端、应用、数据库",
    optionD: "缓存、代理、持久化",
    correctOption: "A",
    explanation: "CAP定理指出分布式系统无法同时满足一致性(Consistency)、可用性(Availability)、分区容错性(Partition Tolerance)，最多满足其中两个。",
    links: "https://en.wikipedia.org/wiki/CAP_theorem",
    difficulty: "advanced"
  },
  {
    questionKey: "sv-014",
    domain: "backend",
    category: "server",
    stem: "关于服务器优雅关闭(Graceful Shutdown)，以下说法正确的是？",
    optionA: "立即终止所有连接",
    optionB: "停止接收新请求，等待现有请求处理完成后关闭",
    optionC: "仅关闭数据库连接",
    optionD: "重启服务器",
    correctOption: "B",
    explanation: "优雅关闭指服务器停止接收新请求，等待正在处理的请求完成后再关闭，避免请求中断导致数据不一致或用户体验问题。",
    links: "https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination",
    difficulty: "advanced"
  },
  {
    questionKey: "sv-015",
    domain: "backend",
    category: "server",
    stem: "服务器性能监控中，P99延迟的含义是？",
    optionA: "平均延迟",
    optionB: "99%的请求延迟低于此值",
    optionC: "最大延迟",
    optionD: "最小延迟",
    correctOption: "B",
    explanation: "P99延迟（99th percentile）表示99%的请求响应时间低于此值，只有1%的请求超过。相比平均值更能反映用户体验。",
    links: "https://en.wikipedia.org/wiki/Percentile",
    difficulty: "advanced"
  }
];

// ==================== API设计 (api) ====================
const apiQuestions: Question[] = [
  // 初级
  {
    questionKey: "api-001",
    domain: "backend",
    category: "api",
    stem: "RESTful API中，用于获取资源的HTTP方法是？",
    optionA: "POST",
    optionB: "GET",
    optionC: "DELETE",
    optionD: "PATCH",
    correctOption: "B",
    explanation: "GET方法用于从服务器获取资源，是幂等的。POST用于创建，PUT用于更新，DELETE用于删除，PATCH用于部分更新。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods/GET",
    difficulty: "beginner"
  },
  {
    questionKey: "api-002",
    domain: "backend",
    category: "api",
    stem: "HTTP状态码200表示？",
    optionA: "请求成功",
    optionB: "资源未找到",
    optionC: "服务器内部错误",
    optionD: "重定向",
    correctOption: "A",
    explanation: "200 OK表示请求成功。404表示资源未找到，500表示服务器内部错误，301/302表示重定向。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/200",
    difficulty: "beginner"
  },
  {
    questionKey: "api-003",
    domain: "backend",
    category: "api",
    stem: "RESTful API设计中，用于创建新资源的HTTP方法是？",
    optionA: "GET",
    optionB: "POST",
    optionC: "PUT",
    optionD: "DELETE",
    correctOption: "B",
    explanation: "POST用于在服务器上创建新资源。GET用于获取，PUT用于完整更新，DELETE用于删除。POST不是幂等的。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods/POST",
    difficulty: "beginner"
  },
  {
    questionKey: "api-004",
    domain: "backend",
    category: "api",
    stem: "HTTP状态码404表示？",
    optionA: "请求成功",
    optionB: "未授权",
    optionC: "资源未找到",
    optionD: "请求超时",
    correctOption: "C",
    explanation: "404 Not Found表示服务器找不到请求的资源。401未授权，403禁止访问，500服务器错误。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/404",
    difficulty: "beginner"
  },
  {
    questionKey: "api-005",
    domain: "backend",
    category: "api",
    stem: "RESTful API的URL设计中，以下哪个是最佳实践？",
    optionA: "GET /getUser?id=1",
    optionB: "GET /users/1",
    optionC: "GET /fetchUser/1",
    optionD: "POST /users/1/get",
    correctOption: "B",
    explanation: "RESTful使用名词复数表示资源，如/users/1。使用HTTP方法表示操作，URL中不包含动词。",
    links: "https://restfulapi.net/resource-naming/",
    difficulty: "beginner"
  },
  // 中级
  {
    questionKey: "api-006",
    domain: "backend",
    category: "api",
    stem: "HTTP状态码401和403的区别是？",
    optionA: "两者相同，都表示未授权",
    optionB: "401未认证，403已认证但无权限",
    optionC: "401资源不存在，403服务器错误",
    optionD: "401临时错误，403永久错误",
    correctOption: "B",
    explanation: "401 Unauthorized表示未提供身份验证或验证失败；403 Forbidden表示已认证但无权访问该资源。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/401",
    difficulty: "intermediate"
  },
  {
    questionKey: "api-007",
    domain: "backend",
    category: "api",
    stem: "RESTful API中，PUT和PATCH的区别是？",
    optionA: "两者完全相同",
    optionB: "PUT完整更新，PATCH部分更新",
    optionC: "PUT创建资源，PATCH更新资源",
    optionD: "PUT安全，PATCH不安全",
    correctOption: "B",
    explanation: "PUT用于完整替换资源（客户端提供完整资源），PATCH用于部分更新（仅提供变更字段）。两者都是幂等的。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods/PATCH",
    difficulty: "intermediate"
  },
  {
    questionKey: "api-008",
    domain: "backend",
    category: "api",
    stem: "关于API幂等性(Idempotency)，以下说法正确的是？",
    optionA: "所有HTTP方法都是幂等的",
    optionB: "幂等操作多次执行结果与一次执行相同",
    optionC: "POST请求天然幂等",
    optionD: "幂等性只与GET请求相关",
    correctOption: "B",
    explanation: "幂等性指同一操作执行一次和多次效果相同。GET、PUT、DELETE、HEAD、OPTIONS是幂等的，POST通常不是幂等的。",
    links: "https://developer.mozilla.org/zh-CN/docs/Glossary/Idempotent",
    difficulty: "intermediate"
  },
  {
    questionKey: "api-009",
    domain: "backend",
    category: "api",
    stem: "API版本控制的最佳实践是？",
    optionA: "不维护版本，直接修改现有API",
    optionB: "在URL中包含版本号，如/api/v1/users",
    optionC: "仅通过文档说明版本",
    optionD: "每次修改都创建新域名",
    correctOption: "B",
    explanation: "API版本控制常见方式：URL路径(/api/v1/users)、请求头(Accept-Version: v1)、查询参数(?version=1)。URL方式最直观常用。",
    links: "https://restfulapi.net/versioning/",
    difficulty: "intermediate"
  },
  {
    questionKey: "api-010",
    domain: "backend",
    category: "api",
    stem: "HTTP状态码204 No Content的含义是？",
    optionA: "请求失败",
    optionB: "请求成功但响应体为空",
    optionC: "重定向到新URL",
    optionD: "服务器繁忙",
    correctOption: "B",
    explanation: "204 No Content表示服务器成功处理请求，但不需要返回响应体。常用于DELETE操作或成功但无数据返回的场景。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/204",
    difficulty: "intermediate"
  },
  // 高级
  {
    questionKey: "api-011",
    domain: "backend",
    category: "api",
    stem: "关于API的HATEOAS(Hypermedia as the Engine of Application State)，以下说法正确的是？",
    optionA: "一种API认证方式",
    optionB: "响应中包含相关操作链接，客户端可动态发现API",
    optionC: "一种数据库查询语言",
    optionD: "一种缓存策略",
    correctOption: "B",
    explanation: "HATEOAS是REST的约束之一，响应中包含相关资源链接，客户端无需硬编码URL，可通过链接发现和操作API，提高API可进化性。",
    links: "https://restfulapi.net/hateoas/",
    difficulty: "advanced"
  },
  {
    questionKey: "api-012",
    domain: "backend",
    category: "api",
    stem: "GraphQL相比REST的主要优势不包括？",
    optionA: "客户端精确获取所需数据，避免过度获取",
    optionB: "单次请求获取多个资源",
    optionC: "天然支持HTTP缓存机制",
    optionD: "强类型Schema定义",
    correctOption: "C",
    explanation: "GraphQL优势包括精确数据获取、单次多资源查询、强类型Schema。但GraphQL通常使用POST，不像REST那样天然利用HTTP缓存机制。",
    links: "https://graphql.org/learn/",
    difficulty: "advanced"
  },
  {
    questionKey: "api-013",
    domain: "backend",
    category: "api",
    stem: "API限流时，返回的HTTP状态码通常是？",
    optionA: "200 OK",
    optionB: "429 Too Many Requests",
    optionC: "503 Service Unavailable",
    optionD: "400 Bad Request",
    correctOption: "B",
    explanation: "429 Too Many Requests表示客户端发送了太多请求，被限流。响应通常包含Retry-After头部指示何时可重试。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/429",
    difficulty: "advanced"
  },
  {
    questionKey: "api-014",
    domain: "backend",
    category: "api",
    stem: "关于API的乐观锁(Optimistic Locking)实现，通常使用哪个HTTP头部？",
    optionA: "Authorization",
    optionB: "If-Match 或 If-None-Match 配合 ETag",
    optionC: "Content-Type",
    optionD: "User-Agent",
    correctOption: "B",
    explanation: "乐观锁常用ETag（实体标签）配合If-Match/If-None-Match头部实现。客户端获取资源时记录ETag，更新时发送If-Match，服务器检查资源是否被修改。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/ETag",
    difficulty: "advanced"
  },
  {
    questionKey: "api-015",
    domain: "backend",
    category: "api",
    stem: "API设计中的Idempotency Key主要用于解决什么问题？",
    optionA: "API认证",
    optionB: "网络超时或重试导致的重复请求问题",
    optionC: "数据加密",
    optionD: "请求压缩",
    correctOption: "B",
    explanation: "Idempotency Key（幂等键）是客户端生成的唯一标识，服务端用它识别重复请求，确保同一业务操作只执行一次，解决网络超时重试导致的重复处理问题。",
    links: "https://stripe.com/docs/api/idempotent_requests",
    difficulty: "advanced"
  }
];

// ==================== 后端框架 (backend-framework) ====================
const backendFrameworkQuestions: Question[] = [
  // 初级
  {
    questionKey: "bf-001",
    domain: "backend",
    category: "backend-framework",
    stem: "Node.js的Express框架中，用于定义路由的HTTP方法是？",
    optionA: "app.route()",
    optionB: "app.get() / app.post() 等",
    optionC: "app.use()",
    optionD: "app.listen()",
    correctOption: "B",
    explanation: "Express使用app.get()、app.post()、app.put()、app.delete()等方法定义对应HTTP方法的路由处理程序。",
    links: "https://expressjs.com/en/guide/routing.html",
    difficulty: "beginner"
  },
  {
    questionKey: "bf-002",
    domain: "backend",
    category: "backend-framework",
    stem: "Python的Django框架遵循的设计模式是？",
    optionA: "MVC (Model-View-Controller)",
    optionB: "MVT (Model-View-Template)",
    optionC: "MVVM (Model-View-ViewModel)",
    optionD: "单体模式",
    correctOption: "B",
    explanation: "Django采用MVT模式：Model（数据模型）、View（业务逻辑）、Template（展示层）。Controller功能由框架本身处理。",
    links: "https://docs.djangoproject.com/en/stable/faq/general/",
    difficulty: "beginner"
  },
  {
    questionKey: "bf-003",
    domain: "backend",
    category: "backend-framework",
    stem: "Java的Spring框架中，用于依赖注入的核心注解是？",
    optionA: "@Controller",
    optionB: "@Autowired",
    optionC: "@RequestMapping",
    optionD: "@Entity",
    correctOption: "B",
    explanation: "@Autowired自动装配依赖，Spring会自动注入匹配的Bean。@Controller标记控制器，@RequestMapping映射请求，@Entity标记实体类。",
    links: "https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-autowired-annotation",
    difficulty: "beginner"
  },
  {
    questionKey: "bf-004",
    domain: "backend",
    category: "backend-framework",
    stem: "Express中，中间件(Middleware)的作用是？",
    optionA: "仅用于处理错误",
    optionB: "处理请求和响应，可执行代码、修改请求响应对象、结束请求周期或调用下一个中间件",
    optionC: "仅用于路由分发",
    optionD: "仅用于静态文件服务",
    correctOption: "B",
    explanation: "中间件是Express的核心概念，可访问请求/响应对象，执行任意代码，修改请求/响应，结束请求或调用next()传递控制权。",
    links: "https://expressjs.com/en/guide/using-middleware.html",
    difficulty: "beginner"
  },
  {
    questionKey: "bf-005",
    domain: "backend",
    category: "backend-framework",
    stem: "Spring Boot的主要优势是？",
    optionA: "仅支持XML配置",
    optionB: "自动配置、内嵌服务器、简化Spring应用开发",
    optionC: "仅用于Web应用",
    optionD: "不需要Java环境",
    correctOption: "B",
    explanation: "Spring Boot提供自动配置、起步依赖、内嵌服务器（Tomcat/Jetty）、Actuator监控等，大幅简化Spring应用开发和部署。",
    links: "https://spring.io/projects/spring-boot",
    difficulty: "beginner"
  },
  // 中级
  {
    questionKey: "bf-006",
    domain: "backend",
    category: "backend-framework",
    stem: "Django的ORM中，用于查询所有记录的方法是？",
    optionA: "Model.objects.find()",
    optionB: "Model.objects.all()",
    optionC: "Model.objects.select()",
    optionD: "Model.objects.query()",
    correctOption: "B",
    explanation: "Django ORM使用Model.objects.all()获取所有记录，.filter()过滤，.get()获取单条，.exclude()排除。",
    links: "https://docs.djangoproject.com/en/stable/topics/db/queries/",
    difficulty: "intermediate"
  },
  {
    questionKey: "bf-007",
    domain: "backend",
    category: "backend-framework",
    stem: "Express中，错误处理中间件的签名是？",
    optionA: "(req, res, next) => {}",
    optionB: "(err, req, res, next) => {}",
    optionC: "(err, res) => {}",
    optionD: "(req, res) => {}",
    correctOption: "B",
    explanation: "Express错误处理中间件有4个参数：err、req、res、next。Express根据参数数量识别错误处理中间件。",
    links: "https://expressjs.com/en/guide/error-handling.html",
    difficulty: "intermediate"
  },
  {
    questionKey: "bf-008",
    domain: "backend",
    category: "backend-framework",
    stem: "Spring中，@RestController和@Controller的区别是？",
    optionA: "没有区别，可以互换",
    optionB: "@RestController = @Controller + @ResponseBody，直接返回数据而非视图",
    optionC: "@RestController仅用于REST API，@Controller用于所有场景",
    optionD: "@Controller是@RestController的父类",
    correctOption: "B",
    explanation: "@RestController是组合注解，等同于@Controller + @ResponseBody，方法返回值直接作为响应体（通常是JSON），不解析为视图。",
    links: "https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-controller-ann-restcontroller",
    difficulty: "intermediate"
  },
  {
    questionKey: "bf-009",
    domain: "backend",
    category: "backend-framework",
    stem: "Django中，用于数据库迁移的命令是？",
    optionA: "django migrate",
    optionB: "python manage.py migrate",
    optionC: "python manage.py syncdb",
    optionD: "django sync",
    correctOption: "B",
    explanation: "Django使用makemigrations创建迁移文件，migrate执行迁移。syncdb是旧版本命令，已废弃。",
    links: "https://docs.djangoproject.com/en/stable/topics/migrations/",
    difficulty: "intermediate"
  },
  {
    questionKey: "bf-010",
    domain: "backend",
    category: "backend-framework",
    stem: "关于ORM(Object-Relational Mapping)，以下说法正确的是？",
    optionA: "ORM将对象映射为数据库表，避免直接写SQL",
    optionB: "ORM比原生SQL性能更好",
    optionC: "ORM不支持事务",
    optionD: "ORM只能用于关系型数据库",
    correctOption: "A",
    explanation: "ORM在对象和数据库表之间建立映射，开发者操作对象而非直接写SQL。ORM可能带来性能损耗，支持事务，主要用于关系型数据库。",
    links: "https://en.wikipedia.org/wiki/Object-relational_mapping",
    difficulty: "intermediate"
  },
  // 高级
  {
    questionKey: "bf-011",
    domain: "backend",
    category: "backend-framework",
    stem: "Spring中，AOP(面向切面编程)的主要应用场景不包括？",
    optionA: "日志记录",
    optionB: "事务管理",
    optionC: "核心业务逻辑实现",
    optionD: "权限检查",
    correctOption: "C",
    explanation: "AOP用于横切关注点如日志、事务、安全、缓存等，将通用功能从业务逻辑中分离。核心业务逻辑应在Service中实现。",
    links: "https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop",
    difficulty: "advanced"
  },
  {
    questionKey: "bf-012",
    domain: "backend",
    category: "backend-framework",
    stem: "Express中，关于集群模式(Cluster)的说法正确的是？",
    optionA: "Node.js是单线程的，无法使用多核CPU",
    optionB: "通过Cluster模块创建多个工作进程，充分利用多核CPU",
    optionC: "集群模式会增加代码复杂度，应避免使用",
    optionD: "集群模式仅用于开发环境",
    correctOption: "B",
    explanation: "Node.js单线程但可通过Cluster模块创建多个工作进程，每个进程运行一个Node实例，充分利用多核CPU，提高吞吐量和可用性。",
    links: "https://nodejs.org/api/cluster.html",
    difficulty: "advanced"
  },
  {
    questionKey: "bf-013",
    domain: "backend",
    category: "backend-framework",
    stem: "Django的WSGI和ASGI的区别是？",
    optionA: "两者完全相同",
    optionB: "WSGI用于同步应用，ASGI支持异步和WebSocket",
    optionC: "WSGI仅用于开发，ASGI仅用于生产",
    optionD: "WSGI是Python标准，ASGI是Django特有",
    correctOption: "B",
    explanation: "WSGI是Python Web服务器网关接口，仅支持同步。ASGI是异步服务器网关接口，支持异步、HTTP/2、WebSocket等现代协议。",
    links: "https://docs.djangoproject.com/en/stable/howto/deployment/asgi/",
    difficulty: "advanced"
  },
  {
    questionKey: "bf-014",
    domain: "backend",
    category: "backend-framework",
    stem: "Spring Boot的自动配置原理主要基于？",
    optionA: "硬编码配置",
    optionB: "@Conditional注解和spring.factories",
    optionC: "仅基于application.properties",
    optionD: "仅基于注解扫描",
    correctOption: "B",
    explanation: "Spring Boot自动配置基于@Conditional条件注解（如@ConditionalOnClass、@ConditionalOnMissingBean）和META-INF/spring.factories中注册的自动配置类。",
    links: "https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.developing-auto-configuration",
    difficulty: "advanced"
  },
  {
    questionKey: "bf-015",
    domain: "backend",
    category: "backend-framework",
    stem: "关于后端框架的依赖注入(DI)和控制反转(IoC)，以下说法正确的是？",
    optionA: "DI和IoC是完全不同的概念",
    optionB: "DI是IoC的一种实现方式，对象依赖由容器注入而非自己创建",
    optionC: "DI会增加组件间的耦合",
    optionD: "IoC只能通过构造函数实现",
    correctOption: "B",
    explanation: "IoC(控制反转)是设计原则，将控制权从应用代码转移到框架。DI(依赖注入)是IoC的实现方式，通过构造器、Setter或接口注入依赖，降低耦合。",
    links: "https://martinfowler.com/articles/injection.html",
    difficulty: "advanced"
  }
];

// ==================== HTTP协议 (http) ====================
const httpQuestions: Question[] = [
  // 初级
  {
    questionKey: "http-001",
    domain: "backend",
    category: "http",
    stem: "HTTP协议默认使用的端口号是？",
    optionA: "21",
    optionB: "80",
    optionC: "443",
    optionD: "8080",
    correctOption: "B",
    explanation: "HTTP默认使用80端口，HTTPS默认使用443端口。21用于FTP，8080是常用替代HTTP端口。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Overview",
    difficulty: "beginner"
  },
  {
    questionKey: "http-002",
    domain: "backend",
    category: "http",
    stem: "HTTPS相比HTTP的主要改进是？",
    optionA: "更快的传输速度",
    optionB: "增加了SSL/TLS加密层，保证数据传输安全",
    optionC: "支持更多请求方法",
    optionD: "支持更大的请求体",
    correctOption: "B",
    explanation: "HTTPS在HTTP下加入SSL/TLS加密层，提供身份认证和数据加密，防止中间人攻击。略微增加开销但不会显著影响速度。",
    links: "https://developer.mozilla.org/zh-CN/docs/Glossary/HTTPS",
    difficulty: "beginner"
  },
  {
    questionKey: "http-003",
    domain: "backend",
    category: "http",
    stem: "HTTP请求方法中，用于获取服务器头部的HEAD方法的特点是？",
    optionA: "获取完整响应体",
    optionB: "仅获取响应头，不返回响应体",
    optionC: "删除资源",
    optionD: "更新资源",
    correctOption: "B",
    explanation: "HEAD方法与GET相同，但服务器不返回响应体，仅返回头部。用于检查资源是否存在、获取元信息而不下载内容。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods/HEAD",
    difficulty: "beginner"
  },
  {
    questionKey: "http-004",
    domain: "backend",
    category: "http",
    stem: "HTTP请求头中，用于指定接受响应内容类型的是？",
    optionA: "Content-Type",
    optionB: "Accept",
    optionC: "Authorization",
    optionD: "User-Agent",
    correctOption: "B",
    explanation: "Accept头部指定客户端可接受的MIME类型，如application/json。Content-Type指示请求/响应体的实际类型。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Accept",
    difficulty: "beginner"
  },
  {
    questionKey: "http-005",
    domain: "backend",
    category: "http",
    stem: "HTTP/1.1中，默认开启的连接方式是？",
    optionA: "短连接，每次请求后关闭",
    optionB: "持久连接(Keep-Alive)，可复用TCP连接",
    optionC: "WebSocket连接",
    optionD: "UDP连接",
    correctOption: "B",
    explanation: "HTTP/1.1默认启用持久连接（Keep-Alive），多个请求可复用同一TCP连接，减少连接建立开销。可通过Connection: close关闭。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Connection_management_in_HTTP_1.x",
    difficulty: "beginner"
  },
  // 中级
  {
    questionKey: "http-006",
    domain: "backend",
    category: "http",
    stem: "HTTP/2相比HTTP/1.1的主要改进不包括？",
    optionA: "二进制分帧层",
    optionB: "多路复用(Multiplexing)",
    optionC: "头部压缩(HPACK)",
    optionD: "默认使用UDP协议",
    correctOption: "D",
    explanation: "HTTP/2基于TCP，主要改进包括二进制分帧、多路复用（单一连接并行传输）、头部压缩(HPACK)、服务器推送。HTTP/3才使用QUIC(基于UDP)。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/HTTP2",
    difficulty: "intermediate"
  },
  {
    questionKey: "http-007",
    domain: "backend",
    category: "http",
    stem: "HTTP缓存头部Cache-Control: max-age=3600表示？",
    optionA: "缓存3600毫秒",
    optionB: "缓存3600秒（1小时）",
    optionC: "缓存3600分钟",
    optionD: "缓存永不过期",
    correctOption: "B",
    explanation: "max-age指令以秒为单位指定资源 freshness 时间。max-age=3600表示资源在3600秒（1小时）内被视为新鲜，可直接使用缓存。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control",
    difficulty: "intermediate"
  },
  {
    questionKey: "http-008",
    domain: "backend",
    category: "http",
    stem: "HTTP状态码301和302的区别是？",
    optionA: "两者完全相同",
    optionB: "301永久重定向，302临时重定向",
    optionC: "301临时重定向，302永久重定向",
    optionD: "301是客户端错误，302是服务器错误",
    correctOption: "B",
    explanation: "301 Moved Permanently表示资源永久移动，搜索引擎应更新URL；302 Found表示临时重定向，后续请求仍应使用原URL。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/301",
    difficulty: "intermediate"
  },
  {
    questionKey: "http-009",
    domain: "backend",
    category: "http",
    stem: "HTTP请求头Content-Type: application/x-www-form-urlencoded通常用于？",
    optionA: "上传文件",
    optionB: "提交表单数据（键值对形式）",
    optionC: "发送JSON数据",
    optionD: "发送XML数据",
    correctOption: "B",
    explanation: "application/x-www-form-urlencoded是HTML表单默认编码，将表单数据编码为键值对字符串（如name=value&age=20）。上传文件使用multipart/form-data。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods/POST",
    difficulty: "intermediate"
  },
  {
    questionKey: "http-010",
    domain: "backend",
    category: "http",
    stem: "关于HTTP的CORS预检请求(Preflight)，以下说法正确的是？",
    optionA: "所有跨域请求都需要预检",
    optionB: "简单请求不需要预检，非简单请求发送OPTIONS预检",
    optionC: "预检请求使用GET方法",
    optionD: "预检请求不需要服务器响应",
    correctOption: "B",
    explanation: "简单请求（GET/HEAD/POST + 标准头部）直接发送。非简单请求（自定义头部、PUT/DELETE等）先发送OPTIONS预检请求，确认允许后再发实际请求。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS#preflighted_requests",
    difficulty: "intermediate"
  },
  // 高级
  {
    questionKey: "http-011",
    domain: "backend",
    category: "http",
    stem: "HTTP/2的服务器推送(Server Push)机制的作用是？",
    optionA: "服务器主动向客户端发送请求",
    optionB: "服务器预测客户端需要的资源，主动推送，减少往返延迟",
    optionC: "客户端向服务器推送数据",
    optionD: "仅用于WebSocket连接",
    correctOption: "B",
    explanation: "HTTP/2服务器推送允许服务器在客户端请求前主动推送资源（如CSS/JS），减少客户端解析HTML后再请求资源的往返延迟。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/HTTP2#server_push",
    difficulty: "advanced"
  },
  {
    questionKey: "http-012",
    domain: "backend",
    category: "http",
    stem: "关于HTTP的ETag和Last-Modified协商缓存，以下说法正确的是？",
    optionA: "ETag基于时间戳，Last-Modified基于内容哈希",
    optionB: "ETag基于内容标识（通常是哈希），Last-Modified基于修改时间",
    optionC: "两者完全相同，可以互换",
    optionD: "ETag仅用于静态资源",
    correctOption: "B",
    explanation: "Last-Modified是资源最后修改时间，ETag是资源内容的唯一标识（通常是哈希）。ETag更精确，可检测1秒内多次修改，优先级更高。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Conditional_requests",
    difficulty: "advanced"
  },
  {
    questionKey: "http-013",
    domain: "backend",
    category: "http",
    stem: "HTTP/3基于什么传输协议？",
    optionA: "TCP",
    optionB: "QUIC（基于UDP）",
    optionC: "SCTP",
    optionD: "WebSocket",
    correctOption: "B",
    explanation: "HTTP/3基于QUIC协议，QUIC基于UDP实现，提供类似TCP的可靠性，同时减少连接建立时间，解决队头阻塞问题。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/HTTP3",
    difficulty: "advanced"
  },
  {
    questionKey: "http-014",
    domain: "backend",
    category: "http",
    stem: "HTTP头部Transfer-Encoding: chunked的作用是？",
    optionA: "压缩传输内容",
    optionB: "分块传输编码，服务器可边生成边发送，无需预先知道内容大小",
    optionC: "加密传输内容",
    optionD: "限制传输速度",
    correctOption: "B",
    explanation: "分块传输编码将响应体分块发送，每块有大小前缀。服务器无需预先知道总大小，可动态生成内容流式传输，适用于大文件或实时数据。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Transfer-Encoding",
    difficulty: "advanced"
  },
  {
    questionKey: "http-015",
    domain: "backend",
    category: "http",
    stem: "关于HTTP的HSTS(HTTP Strict Transport Security)，以下说法正确的是？",
    optionA: "允许HTTP和HTTPS同时访问",
    optionB: "强制浏览器只通过HTTPS访问，防止降级攻击和劫持",
    optionC: "仅用于API认证",
    optionD: "仅用于缓存控制",
    correctOption: "B",
    explanation: "HSTS是安全机制，服务器通过Strict-Transport-Security头部告诉浏览器只使用HTTPS访问，防止SSL剥离攻击，自动将HTTP转为HTTPS。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Strict-Transport-Security",
    difficulty: "advanced"
  }
];

// ==================== 身份验证 (auth) ====================
const authQuestions: Question[] = [
  // 初级
  {
    questionKey: "auth-001",
    domain: "backend",
    category: "auth",
    stem: "HTTP协议中，用于传递用户认证信息的标准头部是？",
    optionA: "Content-Type",
    optionB: "Authorization",
    optionC: "Authentication",
    optionD: "Cookie",
    correctOption: "B",
    explanation: "Authorization头部用于携带认证凭据，如Bearer Token、Basic认证字符串等。格式：Authorization: <type> <credentials>",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Authorization",
    difficulty: "beginner"
  },
  {
    questionKey: "auth-002",
    domain: "backend",
    category: "auth",
    stem: "Session和Cookie的主要区别是？",
    optionA: "两者完全相同",
    optionB: "Cookie存储在客户端，Session数据主要存储在服务器",
    optionC: "Session存储在客户端，Cookie存储在服务器",
    optionD: "Cookie仅用于认证",
    correctOption: "B",
    explanation: "Cookie是存储在客户端的小型文本数据。Session是服务器端存储的用户会话数据，通过Session ID（通常存于Cookie）关联。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies",
    difficulty: "beginner"
  },
  {
    questionKey: "auth-003",
    domain: "backend",
    category: "auth",
    stem: "JWT(JSON Web Token)由哪三部分组成？",
    optionA: "Header、Body、Footer",
    optionB: "Header、Payload、Signature",
    optionC: "Key、Value、Expiry",
    optionD: "ID、Data、Hash",
    correctOption: "B",
    explanation: "JWT由Header（头部，含算法信息）、Payload（负载，含声明）、Signature（签名，验证令牌）三部分组成，用点号分隔。",
    links: "https://jwt.io/introduction",
    difficulty: "beginner"
  },
  {
    questionKey: "auth-004",
    domain: "backend",
    category: "auth",
    stem: "Cookie的HttpOnly属性的作用是？",
    optionA: "仅允许HTTPS传输",
    optionB: "禁止JavaScript访问Cookie，防止XSS攻击",
    optionC: "设置Cookie过期时间",
    optionD: "限制Cookie的域名",
    correctOption: "B",
    explanation: "HttpOnly标记的Cookie无法通过document.cookie访问，有效防止跨站脚本攻击(XSS)窃取Cookie。Secure标记才限制HTTPS。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies#restrict_access_to_cookies",
    difficulty: "beginner"
  },
  {
    questionKey: "auth-005",
    domain: "backend",
    category: "auth",
    stem: "OAuth 2.0主要用于解决什么问题？",
    optionA: "数据库连接",
    optionB: "第三方应用安全访问用户资源，无需暴露用户密码",
    optionC: "服务器负载均衡",
    optionD: "数据加密传输",
    correctOption: "B",
    explanation: "OAuth 2.0是授权框架，允许用户授权第三方应用访问其资源（如账号信息），无需将密码提供给第三方。",
    links: "https://oauth.net/2/",
    difficulty: "beginner"
  },
  // 中级
  {
    questionKey: "auth-006",
    domain: "backend",
    category: "auth",
    stem: "JWT的签名(Signature)主要作用是？",
    optionA: "加密令牌内容",
    optionB: "验证令牌未被篡改，确认发送方身份",
    optionC: "存储用户数据",
    optionD: "设置令牌过期时间",
    correctOption: "B",
    explanation: "签名用于验证消息未被篡改，并验证JWT发送方。签名=HMACSHA256(base64Url(header)+'.'+base64Url(payload), secret)。JWT默认不加密，仅Base64编码。",
    links: "https://jwt.io/introduction",
    difficulty: "intermediate"
  },
  {
    questionKey: "auth-007",
    domain: "backend",
    category: "auth",
    stem: "关于CSRF(跨站请求伪造)攻击，以下说法正确的是？",
    optionA: "CSRF利用用户对网站的信任，诱导用户浏览器发送恶意请求",
    optionB: "CSRF通过注入恶意脚本窃取数据",
    optionC: "CSRF仅影响GET请求",
    optionD: "CSRF无法防御",
    correctOption: "A",
    explanation: "CSRF攻击利用用户已认证的会话，诱导浏览器向目标网站发送恶意请求（如转账）。防御方法包括CSRF Token、SameSite Cookie、验证Referer等。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/Security/CSRF",
    difficulty: "intermediate"
  },
  {
    questionKey: "auth-008",
    domain: "backend",
    category: "auth",
    stem: "Cookie的SameSite属性用于防御什么攻击？",
    optionA: "SQL注入",
    optionB: "CSRF攻击",
    optionC: "XSS攻击",
    optionD: "DDoS攻击",
    correctOption: "B",
    explanation: "SameSite控制Cookie是否随跨站请求发送。Strict完全禁止跨站发送，Lax允许部分安全请求（如GET），None允许跨站但需Secure。有效防御CSRF。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie/SameSite",
    difficulty: "intermediate"
  },
  {
    questionKey: "auth-009",
    domain: "backend",
    category: "auth",
    stem: "OAuth 2.0的授权码模式(Authorization Code)相比隐式模式(Implicit)的优势是？",
    optionA: "流程更简单",
    optionB: "Access Token不经过浏览器，更安全，支持Refresh Token",
    optionC: "不需要客户端密钥",
    optionD: "仅用于移动端",
    correctOption: "B",
    explanation: "授权码模式通过后端交换Token，Token不暴露给浏览器，更安全，支持Refresh Token。隐式模式Token在URL中，不安全，已不推荐使用。",
    links: "https://oauth.net/2/grant-types/authorization-code/",
    difficulty: "intermediate"
  },
  {
    questionKey: "auth-010",
    domain: "backend",
    category: "auth",
    stem: "关于密码存储，以下最佳实践是？",
    optionA: "明文存储便于找回",
    optionB: "使用加盐哈希（如bcrypt、Argon2）存储",
    optionC: "使用MD5或SHA1哈希",
    optionD: "存储在Cookie中",
    correctOption: "B",
    explanation: "密码应使用加盐哈希算法（bcrypt、Argon2、scrypt）存储，每个密码使用随机盐，防止彩虹表攻击。MD5/SHA1已被破解，不应使用。",
    links: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
    difficulty: "intermediate"
  },
  // 高级
  {
    questionKey: "auth-011",
    domain: "backend",
    category: "auth",
    stem: "关于JWT的安全使用，以下说法错误的是？",
    optionA: "JWT应使用HTTPS传输",
    optionB: "JWT可以安全地存储在localStorage中",
    optionC: "敏感信息不应存储在JWT Payload中",
    optionD: "应设置合理的过期时间",
    correctOption: "B",
    explanation: "localStorage易受XSS攻击，JWT存储其中存在风险。推荐存储在httpOnly Cookie中。JWT不应包含敏感信息（仅Base64编码），应使用HTTPS，设置过期时间。",
    links: "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html",
    difficulty: "advanced"
  },
  {
    questionKey: "auth-012",
    domain: "backend",
    category: "auth",
    stem: "OAuth 2.1相比OAuth 2.0的主要变化不包括？",
    optionA: "移除隐式授权(Implicit Grant)",
    optionB: "移除密码凭证授权",
    optionC: "PKCE成为所有客户端的必需",
    optionD: "引入新的加密算法",
    correctOption: "D",
    explanation: "OAuth 2.1基于安全最佳实践更新：移除不安全的隐式授权和密码凭证授权，PKCE成为所有客户端必需，Redirect URI精确匹配。不涉及新加密算法。",
    links: "https://oauth.net/2.1/",
    difficulty: "advanced"
  },
  {
    questionKey: "auth-013",
    domain: "backend",
    category: "auth",
    stem: "关于OpenID Connect(OIDC)和OAuth 2.0的关系，以下说法正确的是？",
    optionA: "两者是完全独立的协议",
    optionB: "OIDC基于OAuth 2.0构建，增加了身份认证层",
    optionC: "OAuth 2.0基于OIDC构建",
    optionD: "OIDC仅用于企业环境",
    correctOption: "B",
    explanation: "OpenID Connect是OAuth 2.0之上的身份层，在授权基础上增加身份认证，提供ID Token包含用户身份信息。OAuth 2.0仅处理授权。",
    links: "https://openid.net/connect/",
    difficulty: "advanced"
  },
  {
    questionKey: "auth-014",
    domain: "backend",
    category: "auth",
    stem: "关于SSO(单点登录)的实现机制，以下说法正确的是？",
    optionA: "每个应用独立验证用户身份",
    optionB: "通过中央认证服务器验证，颁发共享的会话凭证",
    optionC: "SSO会降低安全性",
    optionD: "SSO仅适用于同一域名下的应用",
    correctOption: "B",
    explanation: "SSO通过中央认证服务器(IdP)验证身份，颁发Token或Ticket，各应用信任中央服务器实现一次登录多处访问。可跨域实现，正确实施不会降低安全性。",
    links: "https://en.wikipedia.org/wiki/Single_sign-on",
    difficulty: "advanced"
  },
  {
    questionKey: "auth-015",
    domain: "backend",
    category: "auth",
    stem: "关于Refresh Token机制，以下说法正确的是？",
    optionA: "Refresh Token和Access Token使用方式完全相同",
    optionB: "Refresh Token用于获取新的Access Token，有效期更长，存储更安全",
    optionC: "Refresh Token应随每个请求发送",
    optionD: "Refresh Token不需要安全存储",
    correctOption: "B",
    explanation: "Refresh Token用于在Access Token过期后获取新的Access Token，有效期更长（如7天），应安全存储。Access Token短期有效（如15分钟），随请求发送。",
    links: "https://auth0.com/learn/refresh-tokens/",
    difficulty: "advanced"
  }
];

// ==================== SQL基础 (sql) ====================
const sqlQuestions: Question[] = [
  // 初级
  {
    questionKey: "sql-001",
    domain: "database",
    category: "sql",
    stem: "SQL中，用于查询数据的关键字是？",
    optionA: "INSERT",
    optionB: "SELECT",
    optionC: "UPDATE",
    optionD: "DELETE",
    correctOption: "B",
    explanation: "SELECT用于从数据库查询数据。INSERT插入数据，UPDATE更新数据，DELETE删除数据。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "beginner"
  },
  {
    questionKey: "sql-002",
    domain: "database",
    category: "sql",
    stem: "SQL中，用于删除表中所有数据但保留表结构的语句是？",
    optionA: "DROP TABLE",
    optionB: "DELETE FROM 或 TRUNCATE TABLE",
    optionC: "REMOVE TABLE",
    optionD: "CLEAR TABLE",
    correctOption: "B",
    explanation: "DELETE FROM删除数据可带WHERE条件，支持回滚；TRUNCATE TABLE快速删除所有数据，不可回滚，重置自增计数。DROP TABLE删除整个表结构。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "beginner"
  },
  {
    questionKey: "sql-003",
    domain: "database",
    category: "sql",
    stem: "SQL中，用于计算平均值的聚合函数是？",
    optionA: "SUM()",
    optionB: "AVG()",
    optionC: "COUNT()",
    optionD: "MAX()",
    correctOption: "B",
    explanation: "AVG()计算平均值，SUM()求和，COUNT()计数，MAX()取最大值，MIN()取最小值。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "beginner"
  },
  {
    questionKey: "sql-004",
    domain: "database",
    category: "sql",
    stem: "SQL中，用于按指定列分组的关键字是？",
    optionA: "ORDER BY",
    optionB: "GROUP BY",
    optionC: "PARTITION BY",
    optionD: "SORT BY",
    correctOption: "B",
    explanation: "GROUP BY按指定列分组，常与聚合函数配合使用。ORDER BY排序，PARTITION BY用于窗口函数。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "beginner"
  },
  {
    questionKey: "sql-005",
    domain: "database",
    category: "sql",
    stem: "SQL中，用于限制返回结果数量的子句是？",
    optionA: "LIMIT（MySQL/PostgreSQL）或 TOP（SQL Server）",
    optionB: "RESTRICT",
    optionC: "BOUND",
    optionD: "MAX",
    correctOption: "A",
    explanation: "MySQL/PostgreSQL使用LIMIT n限制返回行数，SQL Server使用TOP n，Oracle使用FETCH FIRST或ROWNUM。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "beginner"
  },
  // 中级
  {
    questionKey: "sql-006",
    domain: "database",
    category: "sql",
    stem: "SQL中，INNER JOIN和LEFT JOIN的区别是？",
    optionA: "两者完全相同",
    optionB: "INNER JOIN返回匹配行，LEFT JOIN返回左表所有行及匹配的右表行",
    optionC: "LEFT JOIN比INNER JOIN性能更好",
    optionD: "INNER JOIN可以没有ON条件",
    correctOption: "B",
    explanation: "INNER JOIN仅返回两表匹配的行。LEFT JOIN返回左表所有行，右表无匹配时返回NULL。RIGHT JOIN、FULL JOIN同理。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "intermediate"
  },
  {
    questionKey: "sql-007",
    domain: "database",
    category: "sql",
    stem: "SQL中，HAVING子句和WHERE子句的区别是？",
    optionA: "两者完全相同，可以互换",
    optionB: "WHERE过滤行，HAVING过滤分组后的结果",
    optionC: "HAVING比WHERE先执行",
    optionD: "WHERE可以与聚合函数一起使用",
    correctOption: "B",
    explanation: "WHERE在分组前过滤行，不能使用聚合函数。HAVING在GROUP BY后过滤分组，可以使用聚合函数如SUM()、COUNT()等。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "intermediate"
  },
  {
    questionKey: "sql-008",
    domain: "database",
    category: "sql",
    stem: "SQL中，用于为查询结果中的行分配唯一序号的窗口函数是？",
    optionA: "RANK()",
    optionB: "ROW_NUMBER()",
    optionC: "DENSE_RANK()",
    optionD: "NTILE()",
    correctOption: "B",
    explanation: "ROW_NUMBER()为每行分配唯一连续序号（1,2,3...）。RANK()相同值同排名但跳号(1,1,3)，DENSE_RANK()不跳号(1,1,2)，NTILE()分桶。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "intermediate"
  },
  {
    questionKey: "sql-009",
    domain: "database",
    category: "sql",
    stem: "SQL中，关于事务ACID特性，以下说法错误的是？",
    optionA: "A=原子性，事务要么全成功要么全失败",
    optionB: "C=一致性，事务前后数据库完整性约束不被破坏",
    optionC: "I=隔离性，事务之间相互影响",
    optionD: "D=持久性，事务提交后数据永久保存",
    correctOption: "C",
    explanation: "隔离性(Isolation)指并发事务之间相互隔离，不会相互影响。数据库通过隔离级别控制并发访问行为。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "intermediate"
  },
  {
    questionKey: "sql-010",
    domain: "database",
    category: "sql",
    stem: "SQL中，用于合并多个SELECT语句结果并去重的操作符是？",
    optionA: "UNION ALL",
    optionB: "UNION",
    optionC: "INTERSECT",
    optionD: "EXCEPT",
    correctOption: "B",
    explanation: "UNION合并结果集并去重，UNION ALL保留所有行（不去重）。INTERSECT返回交集，EXCEPT返回差集。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "intermediate"
  },
  // 高级
  {
    questionKey: "sql-011",
    domain: "database",
    category: "sql",
    stem: "关于SQL的索引，以下说法正确的是？",
    optionA: "索引越多越好",
    optionB: "索引加速查询但会降低写入性能，需要权衡",
    optionC: "索引只能用于主键",
    optionD: "索引不占用额外存储空间",
    correctOption: "B",
    explanation: "索引加速查询但会增加写入开销（需维护索引结构）和存储空间。应合理创建索引，避免过多索引。可用于任意列。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "advanced"
  },
  {
    questionKey: "sql-012",
    domain: "database",
    category: "sql",
    stem: "SQL中，关于CTE(Common Table Expression)的WITH子句，以下说法正确的是？",
    optionA: "仅MySQL支持",
    optionB: "定义临时结果集，可递归查询，提高可读性",
    optionC: "CTE不能引用自身",
    optionD: "CTE性能总是比子查询差",
    correctOption: "B",
    explanation: "CTE(WITH子句)定义命名临时结果集，可多次引用，支持递归查询(Recursive CTE)，提高复杂查询的可读性和可维护性。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "advanced"
  },
  {
    questionKey: "sql-013",
    domain: "database",
    category: "sql",
    stem: "关于SQL的悲观锁和乐观锁，以下说法正确的是？",
    optionA: "悲观锁假设不会冲突，乐观锁假设会冲突",
    optionB: "悲观锁在读取时加锁，乐观锁通过版本号或时间戳检测冲突",
    optionC: "乐观锁需要数据库支持",
    optionD: "悲观锁性能总是更好",
    correctOption: "B",
    explanation: "悲观锁假设会冲突，读取时加锁。乐观锁假设不会冲突，提交时检查版本号/时间戳是否变化，变化则回滚重试。乐观锁适合读多写少场景。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "advanced"
  },
  {
    questionKey: "sql-014",
    domain: "database",
    category: "sql",
    stem: "SQL中，关于EXISTS和IN子查询的区别，以下说法正确的是？",
    optionA: "两者性能完全相同",
    optionB: "EXISTS在找到匹配后立即返回，通常比IN更高效，尤其子查询结果大时",
    optionC: "IN可以处理NULL，EXISTS不能",
    optionD: "EXISTS只能用于相关子查询",
    correctOption: "B",
    explanation: "EXISTS遇到匹配立即返回true，适合大数据量子查询。IN需完整执行子查询。EXISTS通常更高效，尤其在子查询结果集大或 correlated 时。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/SQL",
    difficulty: "advanced"
  },
  {
    questionKey: "sql-015",
    domain: "database",
    category: "sql",
    stem: "关于数据库的MVCC(Multi-Version Concurrency Control)，以下说法正确的是？",
    optionA: "MVCC通过锁机制实现并发控制",
    optionB: "MVCC保存数据多个版本，读不阻塞写，写不阻塞读",
    optionC: "MVCC仅MySQL支持",
    optionD: "MVCC会增加读操作延迟",
    correctOption: "B",
    explanation: "MVCC保存数据多个历史版本，读操作读取快照版本，不阻塞写操作；写操作创建新版本，不阻塞读操作。PostgreSQL、MySQL(InnoDB)等都支持。",
    links: "https://en.wikipedia.org/wiki/Multiversion_concurrency_control",
    difficulty: "advanced"
  }
];

// ==================== 数据库设计 (design) ====================
const designQuestions: Question[] = [
  // 初级
  {
    questionKey: "design-001",
    domain: "database",
    category: "design",
    stem: "数据库设计的第一范式(1NF)要求是？",
    optionA: "表必须有主键",
    optionB: "列值必须是原子的，不可再分",
    optionC: "消除传递依赖",
    optionD: "消除部分依赖",
    correctOption: "B",
    explanation: "第一范式(1NF)要求列值是原子的，不可再分。如不能存储逗号分隔的多值，应拆分到单独表或行。",
    links: "https://en.wikipedia.org/wiki/First_normal_form",
    difficulty: "beginner"
  },
  {
    questionKey: "design-002",
    domain: "database",
    category: "design",
    stem: "数据库表的主键(Primary Key)特性不包括？",
    optionA: "唯一标识每行记录",
    optionB: "值不能重复",
    optionC: "值可以为NULL",
    optionD: "用于建立表关系",
    correctOption: "C",
    explanation: "主键必须唯一且非NULL。用于唯一标识记录、建立外键关系。可为单列或多列组合（复合主键）。",
    links: "https://en.wikipedia.org/wiki/Primary_key",
    difficulty: "beginner"
  },
  {
    questionKey: "design-003",
    domain: "database",
    category: "design",
    stem: "数据库中，外键(Foreign Key)的主要作用是？",
    optionA: "加速查询",
    optionB: "建立表间关系，维护引用完整性",
    optionC: "自动生成主键",
    optionD: "加密数据",
    correctOption: "B",
    explanation: "外键建立表间关联，确保引用完整性。如订单表的user_id引用用户表id，防止引用不存在的用户。",
    links: "https://en.wikipedia.org/wiki/Foreign_key",
    difficulty: "beginner"
  },
  {
    questionKey: "design-004",
    domain: "database",
    category: "design",
    stem: "数据库设计中，一对一关系的实现方式是？",
    optionA: "只能在一张表中实现",
    optionB: "外键加唯一约束，或共享主键",
    optionC: "必须使用中间表",
    optionD: "无法实现",
    correctOption: "B",
    explanation: "一对一可通过：1) 一张表的外键引用另一张表主键并加唯一约束；2) 共享主键（两表主键相同）。",
    links: "https://en.wikipedia.org/wiki/One-to-one_(data_model)",
    difficulty: "beginner"
  },
  {
    questionKey: "design-005",
    domain: "database",
    category: "design",
    stem: "数据库设计中，多对多关系的实现方式是？",
    optionA: "直接在两张表中添加外键",
    optionB: "使用中间关联表（junction table）",
    optionC: "无法实现",
    optionD: "使用JSON字段存储",
    correctOption: "B",
    explanation: "多对多关系通过中间关联表（junction/bridge table）实现，包含两个外键分别引用相关表的主键。",
    links: "https://en.wikipedia.org/wiki/Many-to-many_(data_model)",
    difficulty: "beginner"
  },
  // 中级
  {
    questionKey: "design-006",
    domain: "database",
    category: "design",
    stem: "数据库第三范式(3NF)的要求是？",
    optionA: "满足2NF，且消除传递依赖",
    optionB: "满足1NF即可",
    optionC: "消除所有冗余",
    optionD: "仅要求有主键",
    correctOption: "A",
    explanation: "第三范式(3NF)要求满足2NF，且非主属性不传递依赖于主键。即非主属性必须直接依赖于主键，不能依赖于其他非主属性。",
    links: "https://en.wikipedia.org/wiki/Third_normal_form",
    difficulty: "intermediate"
  },
  {
    questionKey: "design-007",
    domain: "database",
    category: "design",
    stem: "数据库设计中，ER图(Entity-Relationship Diagram)的作用是？",
    optionA: "仅用于数据库性能优化",
    optionB: "可视化表示实体、属性和实体间关系",
    optionC: "仅用于SQL编写",
    optionD: "仅用于数据备份",
    correctOption: "B",
    explanation: "ER图是概念数据模型，用图形表示实体（矩形）、属性（椭圆）、关系（菱形），帮助设计和沟通数据库结构。",
    links: "https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model",
    difficulty: "intermediate"
  },
  {
    questionKey: "design-008",
    domain: "database",
    category: "design",
    stem: "关于数据库反规范化(Denormalization)，以下说法正确的是？",
    optionA: "反规范化总是错误的",
    optionB: "为提高查询性能，有意引入冗余，以空间换时间",
    optionC: "反规范化会提高数据一致性",
    optionD: "反规范化只在数据仓库中使用",
    correctOption: "B",
    explanation: "反规范化有意引入数据冗余，减少表连接，提高读性能。代价是增加存储、降低写入性能、需要维护数据一致性。OLAP场景常见。",
    links: "https://en.wikipedia.org/wiki/Denormalization",
    difficulty: "intermediate"
  },
  {
    questionKey: "design-009",
    domain: "database",
    category: "design",
    stem: "数据库设计中，自关联(Self-Referencing)关系用于表示？",
    optionA: "表与自身的关系，如层级结构（员工-经理）",
    optionB: "表与表之间的关系",
    optionC: "主键与外键的关系",
    optionD: "索引与数据的关系",
    correctOption: "A",
    explanation: "自关联是表的外键引用自身主键，用于表示层级结构，如员工表manager_id引用同表id表示上下级关系，或分类的父子关系。",
    links: "https://en.wikipedia.org/wiki/Recursive_relationship",
    difficulty: "intermediate"
  },
  {
    questionKey: "design-010",
    domain: "database",
    category: "design",
    stem: "关于数据库的软删除(Soft Delete)，以下说法正确的是？",
    optionA: "直接从数据库删除记录",
    optionB: "添加标记列（如deleted_at），标记为已删除但不实际删除",
    optionC: "仅删除索引",
    optionD: "将数据移到另一个数据库",
    correctOption: "B",
    explanation: "软删除通过添加deleted_at或is_deleted标记记录状态，不实际删除数据。优点是可恢复、保留历史、维护外键关系。查询时需过滤。",
    links: "https://en.wikipedia.org/wiki/Soft_delete",
    difficulty: "intermediate"
  },
  // 高级
  {
    questionKey: "design-011",
    domain: "database",
    category: "design",
    stem: "数据库的BCNF(Boyce-Codd Normal Form)与3NF的区别是？",
    optionA: "两者完全相同",
    optionB: "BCNF更严格，要求每个决定因素都是候选键",
    optionC: "3NF更严格",
    optionD: "BCNF不要求消除传递依赖",
    correctOption: "B",
    explanation: "BCNF是3NF的加强版，要求对于每个函数依赖X→Y，X必须是超键（候选键）。3NF允许主属性对键的传递依赖，BCNF不允许。",
    links: "https://en.wikipedia.org/wiki/Boyce%E2%80%93Codd_normal_form",
    difficulty: "advanced"
  },
  {
    questionKey: "design-012",
    domain: "database",
    category: "design",
    stem: "关于数据库的垂直拆分和水平拆分，以下说法正确的是？",
    optionA: "垂直拆分按行分，水平拆分按列分",
    optionB: "垂直拆分按列分（如冷热数据分离），水平拆分按行分（如按用户ID取模）",
    optionC: "两者完全相同",
    optionD: "垂直拆分仅用于MySQL",
    correctOption: "B",
    explanation: "垂直拆分按列拆分，将不同字段分到不同表/库（如用户基本信息和详情）。水平拆分（Sharding）按行拆分，将数据分布到多个节点。",
    links: "https://en.wikipedia.org/wiki/Database_sharding",
    difficulty: "advanced"
  },
  {
    questionKey: "design-013",
    domain: "database",
    category: "design",
    stem: "数据库设计中，UUID作为主键相比自增ID的优势不包括？",
    optionA: "全局唯一，适合分布式系统",
    optionB: "安全性更好，不易被猜测",
    optionC: "占用存储空间更小",
    optionD: "合并数据时不会冲突",
    correctOption: "C",
    explanation: "UUID(128位)比自增ID(32/64位)占用更多空间，索引效率较低。优势是全局唯一、安全、分布式友好。",
    links: "https://en.wikipedia.org/wiki/Universally_unique_identifier",
    difficulty: "advanced"
  },
  {
    questionKey: "design-014",
    domain: "database",
    category: "design",
    stem: "关于数据库的写入时复制(Copy-on-Write)策略，以下说法正确的是？",
    optionA: "读取时复制数据",
    optionB: "写操作创建数据副本，读操作不受影响，适合高读场景",
    optionC: "同时读写相同数据",
    optionD: "仅用于内存数据库",
    correctOption: "B",
    explanation: "COW策略下，写操作创建数据新副本而非直接修改，读操作继续访问原数据。实现读写分离，读无锁，适合读多写少场景。",
    links: "https://en.wikipedia.org/wiki/Copy-on-write",
    difficulty: "advanced"
  },
  {
    questionKey: "design-015",
    domain: "database",
    category: "design",
    stem: "数据库设计中，关于最终一致性(Eventual Consistency)的说法正确的是？",
    optionA: "所有节点数据实时一致",
    optionB: "允许短暂不一致，保证最终所有节点数据一致",
    optionC: "完全不保证一致性",
    optionD: "仅适用于单机数据库",
    correctOption: "B",
    explanation: "最终一致性是分布式系统的弱一致性模型，允许短暂不一致，但保证在没有新更新的情况下，最终所有副本达到一致。常用于NoSQL和高可用系统。",
    links: "https://en.wikipedia.org/wiki/Eventual_consistency",
    difficulty: "advanced"
  }
];

// ==================== 查询优化 (optimization) ====================
const optimizationQuestions: Question[] = [
  // 初级
  {
    questionKey: "opt-001",
    domain: "database",
    category: "optimization",
    stem: "数据库索引的主要作用是？",
    optionA: "增加存储空间",
    optionB: "加速数据查询",
    optionC: "保证数据唯一性",
    optionD: "加密数据",
    correctOption: "B",
    explanation: "索引是数据结构（通常是B+树），加速WHERE、ORDER BY、JOIN等查询操作。类似书籍目录，快速定位数据。",
    links: "https://en.wikipedia.org/wiki/Database_index",
    difficulty: "beginner"
  },
  {
    questionKey: "opt-002",
    domain: "database",
    category: "optimization",
    stem: "数据库中最常用的索引类型是？",
    optionA: "哈希索引",
    optionB: "B+树索引",
    optionC: "位图索引",
    optionD: "全文索引",
    correctOption: "B",
    explanation: "B+树索引是最常用的索引结构，支持范围查询、排序，查询性能稳定(O(log n))。MySQL InnoDB、PostgreSQL默认使用B+树。",
    links: "https://en.wikipedia.org/wiki/B%2B_tree",
    difficulty: "beginner"
  },
  {
    questionKey: "opt-003",
    domain: "database",
    category: "optimization",
    stem: "数据库查询中，SELECT * 的潜在问题是？",
    optionA: "语法错误",
    optionB: "可能返回不需要的列，增加IO和网络开销",
    optionC: "无法使用索引",
    optionD: "只能返回一行",
    correctOption: "B",
    explanation: "SELECT *返回所有列，可能包含大字段或不必要数据，增加磁盘IO、内存使用、网络传输。应只查询需要的列。",
    links: "https://use-the-index-luke.com/sql/antipatterns/select-star",
    difficulty: "beginner"
  },
  {
    questionKey: "opt-004",
    domain: "database",
    category: "optimization",
    stem: "数据库查询中，WHERE子句中对列使用函数会导致？",
    optionA: "查询更快",
    optionB: "无法使用该列上的索引，导致全表扫描",
    optionC: "自动创建新索引",
    optionD: "无影响",
    correctOption: "B",
    explanation: "WHERE YEAR(date_col) = 2023这类函数操作会使索引失效，因为索引存储的是原始值。应改写为范围查询：date_col >= '2023-01-01' AND date_col < '2024-01-01'",
    links: JSON.stringify([{title: "SQL索引优化", url: "https://use-the-index-luke.com/sql/where-clause/obfuscation"}]),
    difficulty: "beginner"
  },
  {
    questionKey: "opt-005",
    domain: "database",
    category: "optimization",
    stem: "数据库查询优化中，EXPLAIN命令的作用是？",
    optionA: "执行查询并返回结果",
    optionB: "显示查询执行计划，帮助分析性能",
    optionC: "创建索引",
    optionD: "删除数据",
    correctOption: "B",
    explanation: "EXPLAIN显示查询优化器选择的执行计划，包括使用的索引、扫描行数、连接方式等，是SQL优化的重要工具。",
    links: "https://dev.mysql.com/doc/refman/8.0/en/explain-output.html",
    difficulty: "beginner"
  },
  // 中级
  {
    questionKey: "opt-006",
    domain: "database",
    category: "optimization",
    stem: "数据库中，覆盖索引(Covering Index)的含义是？",
    optionA: "索引覆盖所有表数据",
    optionB: "查询所需的所有列都在索引中，无需回表查询",
    optionC: "索引覆盖所有查询条件",
    optionD: "索引大小覆盖整个磁盘",
    correctOption: "B",
    explanation: "覆盖索引指查询所需的所有列（SELECT、WHERE、ORDER BY）都包含在索引中，数据库无需回表获取数据，大幅减少IO。",
    links: "https://use-the-index-luke.com/sql/clustering/index-only-scan-covering-index",
    difficulty: "intermediate"
  },
  {
    questionKey: "opt-007",
    domain: "database",
    category: "optimization",
    stem: "数据库查询中，最左前缀原则(Leftmost Prefix Rule)适用于？",
    optionA: "哈希索引",
    optionB: "B+树复合索引",
    optionC: "位图索引",
    optionD: "所有索引类型",
    correctOption: "B",
    explanation: "复合索引(a,b,c)遵循最左前缀原则，查询条件必须从最左列开始才能使用索引。如WHERE a=1 AND b=2可用索引，WHERE b=2不能用。",
    links: "https://use-the-index-luke.com/sql/where-clause/the-equality-operator/concatenated-keys",
    difficulty: "intermediate"
  },
  {
    questionKey: "opt-008",
    domain: "database",
    category: "optimization",
    stem: "数据库中，关于查询优化器选择全表扫描而非索引扫描的场景，以下说法正确的是？",
    optionA: "优化器总是选择索引扫描",
    optionB: "当需要返回大量数据时，全表扫描可能比索引扫描更高效",
    optionC: "索引扫描总是更快",
    optionD: "全表扫描已被淘汰",
    correctOption: "B",
    explanation: "当查询返回大量数据（如超过表20-30%）时，全表扫描顺序IO可能比索引的随机IO更高效。优化器基于统计信息选择最优计划。",
    links: "https://use-the-index-luke.com/sql/where-clause/searching-for-ranges/greater-less-between",
    difficulty: "intermediate"
  },
  {
    questionKey: "opt-009",
    domain: "database",
    category: "optimization",
    stem: "数据库中，关于JOIN操作的优化，以下说法正确的是？",
    optionA: "JOIN总是很慢，应避免使用",
    optionB: "确保JOIN条件列有索引，小表驱动大表",
    optionC: "JOIN顺序不影响性能",
    optionD: "LEFT JOIN比INNER JOIN快",
    correctOption: "B",
    explanation: "JOIN优化：确保ON条件列有索引；小表驱动大表减少扫描；避免SELECT *；考虑反规范化。JOIN本身不慢，不当使用才慢。",
    links: "https://dev.mysql.com/doc/refman/8.0/en/optimize-nested-queries.html",
    difficulty: "intermediate"
  },
  {
    questionKey: "opt-010",
    domain: "database",
    category: "optimization",
    stem: "数据库中，关于索引下推(Index Condition Pushdown, ICP)的说法正确的是？",
    optionA: "将索引存储到磁盘",
    optionB: "在存储引擎层过滤数据，减少回表次数",
    optionC: "将索引加载到内存",
    optionD: "删除不需要的索引",
    correctOption: "B",
    explanation: "ICP是MySQL优化，将WHERE条件中能使用索引的部分下推到存储引擎层过滤，减少回表查询次数，提高性能。",
    links: "https://dev.mysql.com/doc/refman/8.0/en/index-condition-pushdown-optimization.html",
    difficulty: "intermediate"
  },
  // 高级
  {
    questionKey: "opt-011",
    domain: "database",
    category: "optimization",
    stem: "数据库中，关于索引选择性(Selectivity)的说法正确的是？",
    optionA: "选择性越高，索引效果越差",
    optionB: "选择性=不同值数量/总行数，高选择性索引效果更好",
    optionC: "选择性与索引性能无关",
    optionD: "选择性越低越好",
    correctOption: "B",
    explanation: "索引选择性=不同值数/总行数，范围0-1。高选择性（接近1，如唯一索引）索引过滤效果好。低选择性（如性别字段）索引效果差，可能不如全表扫描。",
    links: "https://use-the-index-luke.com/sql/where-clause/the-equality-operator/selectivity",
    difficulty: "advanced"
  },
  {
    questionKey: "opt-012",
    domain: "database",
    category: "optimization",
    stem: "关于数据库的查询重写(Query Rewrite)优化，以下说法正确的是？",
    optionA: "查询重写会改变查询结果",
    optionB: "优化器将查询转换为等价但更高效的形式，如子查询改JOIN",
    optionC: "查询重写仅手动进行",
    optionD: "查询重写会降低性能",
    correctOption: "B",
    explanation: "查询重写是优化器将SQL转换为语义等价但执行效率更高的形式，如子查询转JOIN、谓词下推、视图合并等，不改变结果。",
    links: "https://en.wikipedia.org/wiki/Query_optimization",
    difficulty: "advanced"
  },
  {
    questionKey: "opt-013",
    domain: "database",
    category: "optimization",
    stem: "数据库中，关于物化视图(Materialized View)的说法正确的是？",
    optionA: "物化视图和视图完全相同",
    optionB: "物化视图存储查询结果，定期刷新，加速复杂查询",
    optionC: "物化视图总是实时更新",
    optionD: "物化视图不能创建索引",
    correctOption: "B",
    explanation: "物化视图存储查询结果物理副本，可创建索引，定期或手动刷新。适合复杂聚合查询、数据仓库场景。普通视图是虚拟表，每次查询执行SQL。",
    links: "https://en.wikipedia.org/wiki/Materialized_view",
    difficulty: "advanced"
  },
  {
    questionKey: "opt-014",
    domain: "database",
    category: "optimization",
    stem: "关于数据库的分区表(Partitioning)，以下说法正确的是？",
    optionA: "分区表是多个独立的表",
    optionB: "将大表按规则分成小分区，提高查询和维护效率",
    optionC: "分区后不能使用索引",
    optionD: "分区仅用于MySQL",
    correctOption: "B",
    explanation: "分区将大表按范围、列表、哈希等规则分成小分区，查询可只扫描相关分区（分区裁剪），提高查询性能。也便于维护（如清理历史数据）。",
    links: "https://dev.mysql.com/doc/refman/8.0/en/partitioning.html",
    difficulty: "advanced"
  },
  {
    questionKey: "opt-015",
    domain: "database",
    category: "optimization",
    stem: "关于数据库的直方图统计信息(Histogram Statistics)，以下说法正确的是？",
    optionA: "直方图用于图形化显示查询结果",
    optionB: "直方图存储列的数据分布，帮助优化器评估选择性",
    optionC: "直方图仅用于时间类型列",
    optionD: "直方图会降低查询性能",
    correctOption: "B",
    explanation: "直方图统计信息存储列的数据分布（如值的频率），帮助优化器更准确地评估WHERE条件的选择性，生成更优执行计划。特别适用于数据分布不均匀的列。",
    links: "https://dev.mysql.com/doc/refman/8.0/en/histograms.html",
    difficulty: "advanced"
  }
];

// ==================== 合并所有题目 ====================
const allQuestions: Question[] = [
  ...htmlCssQuestions,
  ...jsQuestions,
  ...frameworkQuestions,
  ...browserQuestions,
  ...serverQuestions,
  ...apiQuestions,
  ...backendFrameworkQuestions,
  ...httpQuestions,
  ...authQuestions,
  ...sqlQuestions,
  ...designQuestions,
  ...optimizationQuestions
];

// ==================== 统计信息 ====================
function printStatistics() {
  const totalCount = allQuestions.length;
  const domainCount = {
    frontend: allQuestions.filter(q => q.domain === "frontend").length,
    backend: allQuestions.filter(q => q.domain === "backend").length,
    database: allQuestions.filter(q => q.domain === "database").length
  };
  const difficultyCount = {
    beginner: allQuestions.filter(q => q.difficulty === "beginner").length,
    intermediate: allQuestions.filter(q => q.difficulty === "intermediate").length,
    advanced: allQuestions.filter(q => q.difficulty === "advanced").length
  };
  const categoryCount = allQuestions.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("=".repeat(50));
  console.log("编程知识题库统计信息");
  console.log("=".repeat(50));
  console.log(`总题数: ${totalCount}`);
  console.log("\n按领域分布:");
  console.log(`  - 前端(frontend): ${domainCount.frontend}题`);
  console.log(`  - 后端(backend): ${domainCount.backend}题`);
  console.log(`  - 数据库(database): ${domainCount.database}题`);
  console.log("\n按难度分布:");
  console.log(`  - 初级(beginner): ${difficultyCount.beginner}题 (${Math.round(difficultyCount.beginner/totalCount*100)}%)`);
  console.log(`  - 中级(intermediate): ${difficultyCount.intermediate}题 (${Math.round(difficultyCount.intermediate/totalCount*100)}%)`);
  console.log(`  - 高级(advanced): ${difficultyCount.advanced}题 (${Math.round(difficultyCount.advanced/totalCount*100)}%)`);
  console.log("\n按分类分布:");
  Object.entries(categoryCount).sort().forEach(([category, count]) => {
    console.log(`  - ${category}: ${count}题`);
  });
  console.log("=".repeat(50));
}

// ==================== 种子数据插入 ====================
async function seedQuestions() {
  console.log("开始导入编程知识题库...\n");
  
  // 打印统计信息
  printStatistics();
  console.log("\n");

  try {
    // 清空现有数据（可选，根据需求决定是否保留）
    // await db.delete(programmingQuestions);
    // console.log("已清空现有题目数据");

    // 批量插入题目
    const batchSize = 50;
    for (let i = 0; i < allQuestions.length; i += batchSize) {
      const batch = allQuestions.slice(i, i + batchSize);
      await db.insert(programmingQuestions).values(batch);
      console.log(`已导入 ${Math.min(i + batchSize, allQuestions.length)} / ${allQuestions.length} 题`);
    }

    console.log("\n题目导入完成！");
    console.log(`总计导入: ${allQuestions.length} 道题目`);
  } catch (error) {
    console.error("导入失败:", error);
    throw error;
  }
}

// 执行种子脚本
seedQuestions()
  .then(() => {
    console.log("\n种子脚本执行成功！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n种子脚本执行失败:", error);
    process.exit(1);
  });