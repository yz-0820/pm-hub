/**
 * 批量添加编程知识题目
 * 添加270道新题目（3领域 × 3难度 × 30题）
 */

import { db } from "../lib/db/client";
import { programmingQuestions } from "../lib/db/schema";

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

// ==================== 前端开发 - 简单 (30题) ====================
const frontendBeginner: Question[] = [
  {
    questionKey: "fb-001",
    domain: "frontend",
    category: "html-css",
    stem: "HTML中，用于定义超链接的标签是？",
    optionA: "<link>",
    optionB: "<a>",
    optionC: "<href>",
    optionD: "<url>",
    correctOption: "B",
    explanation: "<a>标签用于定义超链接，href属性指定链接目标。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-002",
    domain: "frontend",
    category: "html-css",
    stem: "CSS中，用于设置文字颜色的属性是？",
    optionA: "text-color",
    optionB: "font-color",
    optionC: "color",
    optionD: "foreground",
    correctOption: "C",
    explanation: "color属性用于设置文本颜色，是CSS的基础属性。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/color",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-003",
    domain: "frontend",
    category: "html-css",
    stem: "HTML中，<img>标签的哪个属性用于指定图片路径？",
    optionA: "href",
    optionB: "src",
    optionC: "path",
    optionD: "url",
    correctOption: "B",
    explanation: "src属性用于指定图片的URL路径，是<img>标签的必需属性。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-004",
    domain: "frontend",
    category: "html-css",
    stem: "CSS中，用于设置元素背景颜色的属性是？",
    optionA: "background-image",
    optionB: "background-color",
    optionC: "bgcolor",
    optionD: "background",
    correctOption: "B",
    explanation: "background-color属性用于设置元素的背景颜色。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/background-color",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-005",
    domain: "frontend",
    category: "html-css",
    stem: "HTML中，用于创建无序列表的标签是？",
    optionA: "<ol>",
    optionB: "<ul>",
    optionC: "<li>",
    optionD: "<list>",
    correctOption: "B",
    explanation: "<ul>标签用于创建无序列表，列表项使用<li>标签。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/ul",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-006",
    domain: "frontend",
    category: "html-css",
    stem: "CSS中，用于设置字体大小的属性是？",
    optionA: "text-size",
    optionB: "font-size",
    optionC: "size",
    optionD: "text-font",
    correctOption: "B",
    explanation: "font-size属性用于设置字体大小，可以使用px、em、rem等单位。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/font-size",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-007",
    domain: "frontend",
    category: "html-css",
    stem: "HTML中，<br>标签的作用是？",
    optionA: "创建段落",
    optionB: "插入水平线",
    optionC: "换行",
    optionD: "加粗文字",
    correctOption: "C",
    explanation: "<br>标签用于在文本中插入一个简单的换行符。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/br",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-008",
    domain: "frontend",
    category: "html-css",
    stem: "CSS中，用于设置元素宽度的属性是？",
    optionA: "height",
    optionB: "width",
    optionC: "size",
    optionD: "length",
    correctOption: "B",
    explanation: "width属性用于设置元素的宽度。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/width",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-009",
    domain: "frontend",
    category: "html-css",
    stem: "HTML中，用于定义表格行的标签是？",
    optionA: "<td>",
    optionB: "<tr>",
    optionC: "<th>",
    optionD: "<table>",
    correctOption: "B",
    explanation: "<tr>标签用于定义表格中的行。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/tr",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-010",
    domain: "frontend",
    category: "html-css",
    stem: "CSS中，用于设置文字居中对齐的属性值是？",
    optionA: "left",
    optionB: "right",
    optionC: "center",
    optionD: "justify",
    correctOption: "C",
    explanation: "text-align: center用于设置文本水平居中对齐。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/text-align",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-011",
    domain: "frontend",
    category: "javascript",
    stem: "JavaScript中，用于声明变量的关键字是？",
    optionA: "var",
    optionB: "variable",
    optionC: "let",
    optionD: "A和C都是",
    correctOption: "D",
    explanation: "var和let都可以用于声明变量，let是ES6引入的块级作用域变量声明方式。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/let",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-012",
    domain: "frontend",
    category: "javascript",
    stem: "JavaScript中，console.log()的作用是？",
    optionA: "弹出警告框",
    optionB: "在控制台输出信息",
    optionC: "在页面显示信息",
    optionD: "记录到文件",
    correctOption: "B",
    explanation: "console.log()用于在浏览器的开发者工具控制台输出信息，便于调试。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/API/Console/log",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-013",
    domain: "frontend",
    category: "javascript",
    stem: "JavaScript中，以下哪个不是基本数据类型？",
    optionA: "string",
    optionB: "number",
    optionC: "array",
    optionD: "boolean",
    correctOption: "C",
    explanation: "array（数组）是对象类型，不是基本数据类型。基本数据类型包括string、number、boolean、null、undefined、symbol、bigint。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Data_structures",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-014",
    domain: "frontend",
    category: "javascript",
    stem: "JavaScript中，用于获取元素的方法getElementById的参数是？",
    optionA: "元素的tag名",
    optionB: "元素的class名",
    optionC: "元素的id",
    optionD: "元素的name",
    correctOption: "C",
    explanation: "getElementById方法通过元素的id属性值获取元素，id在页面中应该是唯一的。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/API/Document/getElementById",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-015",
    domain: "frontend",
    category: "javascript",
    stem: "JavaScript中，alert()函数的作用是？",
    optionA: "在控制台输出",
    optionB: "弹出警告对话框",
    optionC: "发送网络请求",
    optionD: "刷新页面",
    correctOption: "B",
    explanation: "alert()函数会显示一个带有指定消息和确认按钮的警告对话框。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/API/Window/alert",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-016",
    domain: "frontend",
    category: "javascript",
    stem: "JavaScript中，数组的length属性表示？",
    optionA: "数组占用的字节数",
    optionB: "数组的最后一个索引",
    optionC: "数组中元素的数量",
    optionD: "数组的容量",
    correctOption: "C",
    explanation: "length属性返回数组中元素的个数。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/length",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-017",
    domain: "frontend",
    category: "javascript",
    stem: "JavaScript中，typeof操作符返回的是什么？",
    optionA: "变量的值",
    optionB: "变量的类型字符串",
    optionC: "变量的内存地址",
    optionD: "变量的名称",
    correctOption: "B",
    explanation: "typeof操作符返回一个字符串，表示操作数的类型，如'string'、'number'、'object'等。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/typeof",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-018",
    domain: "frontend",
    category: "javascript",
    stem: "JavaScript中，以下哪个运算符用于严格相等比较？",
    optionA: "==",
    optionB: "===",
    optionC: "=",
    optionD: "!=",
    correctOption: "B",
    explanation: "===是严格相等运算符，比较值和类型都相等时才返回true。==会进行类型转换后再比较。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Strict_equality",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-019",
    domain: "frontend",
    category: "javascript",
    stem: "JavaScript中，函数声明使用的关键字是？",
    optionA: "func",
    optionB: "function",
    optionC: "def",
    optionD: "fn",
    correctOption: "B",
    explanation: "function关键字用于声明函数，后面跟着函数名和参数列表。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/function",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-020",
    domain: "frontend",
    category: "javascript",
    stem: "JavaScript中，parseInt()函数的作用是？",
    optionA: "将字符串解析为整数",
    optionB: "将数字转为字符串",
    optionC: "将小数转为整数",
    optionD: "判断是否为整数",
    correctOption: "A",
    explanation: "parseInt()函数解析一个字符串参数，并返回一个指定基数的整数。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/parseInt",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-021",
    domain: "frontend",
    category: "react",
    stem: "React中，用于创建组件的函数名首字母应该？",
    optionA: "小写",
    optionB: "大写",
    optionC: "无所谓",
    optionD: "下划线开头",
    correctOption: "B",
    explanation: "React组件名必须以大写字母开头，小写字母开头的标签会被认为是HTML原生标签。",
    links: "https://react.dev/learn/thinking-in-react",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-022",
    domain: "frontend",
    category: "react",
    stem: "React中，JSX表达式应该写在什么符号内？",
    optionA: "引号",
    optionB: "花括号 {}",
    optionC: "方括号 []",
    optionD: "圆括号 ()",
    correctOption: "B",
    explanation: "在JSX中，使用花括号{}包裹JavaScript表达式，可以在JSX中嵌入变量、表达式等。",
    links: "https://react.dev/learn/javascript-in-jsx-with-curly-braces",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-023",
    domain: "frontend",
    category: "react",
    stem: "React中，props的作用是什么？",
    optionA: "存储组件内部状态",
    optionB: "组件之间传递数据",
    optionC: "定义组件样式",
    optionD: "控制组件渲染",
    correctOption: "B",
    explanation: "props用于在组件之间传递数据，是父组件向子组件传递数据的方式。",
    links: "https://react.dev/learn/thinking-in-react#step-2-build-a-static-version-in-react",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-024",
    domain: "frontend",
    category: "react",
    stem: "React中，用于管理组件内部状态的方法是？",
    optionA: "props",
    optionB: "state",
    optionC: "render",
    optionD: "component",
    correctOption: "B",
    explanation: "state用于管理组件的内部状态，当state变化时组件会重新渲染。",
    links: "https://react.dev/learn/state-a-components-memory",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-025",
    domain: "frontend",
    category: "react",
    stem: "React Hooks中，useState的作用是？",
    optionA: "发起网络请求",
    optionB: "管理组件状态",
    optionC: "操作DOM",
    optionD: "定义路由",
    correctOption: "B",
    explanation: "useState是React Hook，用于在函数组件中添加状态管理功能。",
    links: "https://react.dev/reference/react/useState",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-026",
    domain: "frontend",
    category: "react",
    stem: "React中，组件的返回值必须是什么？",
    optionA: "字符串",
    optionB: "JSX（或null）",
    optionC: "数字",
    optionD: "对象",
    correctOption: "B",
    explanation: "React组件必须返回JSX元素，或者返回null表示不渲染任何内容。",
    links: "https://react.dev/learn/your-first-component",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-027",
    domain: "frontend",
    category: "browser",
    stem: "浏览器中，用于存储键值对数据的存储机制是？",
    optionA: "Cookie",
    optionB: "localStorage",
    optionC: "Session",
    optionD: "Cache",
    correctOption: "B",
    explanation: "localStorage是Web Storage API的一部分，用于在浏览器中持久存储键值对数据。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/API/Window/localStorage",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-028",
    domain: "frontend",
    category: "browser",
    stem: "浏览器开发者工具中，Console面板的主要作用是？",
    optionA: "查看页面结构",
    optionB: "调试JavaScript",
    optionC: "查看网络请求",
    optionD: "管理存储",
    correctOption: "B",
    explanation: "Console面板主要用于输出日志信息、执行JavaScript代码和调试。",
    links: "https://developer.chrome.com/docs/devtools/console",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-029",
    domain: "frontend",
    category: "browser",
    stem: "DOM操作中，document.getElementById()返回的是？",
    optionA: "元素数组",
    optionB: "单个元素或null",
    optionC: "节点列表",
    optionD: "布尔值",
    correctOption: "B",
    explanation: "getElementById返回匹配id的单个元素，如果没有找到则返回null。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/API/Document/getElementById",
    difficulty: "beginner"
  },
  {
    questionKey: "fb-030",
    domain: "frontend",
    category: "browser",
    stem: "浏览器中，阻止事件默认行为的方法是？",
    optionA: "stopPropagation()",
    optionB: "preventDefault()",
    optionC: "stop()",
    optionD: "cancel()",
    correctOption: "B",
    explanation: "event.preventDefault()阻止元素的默认行为，如阻止链接跳转、表单提交等。",
    links: "https://developer.mozilla.org/zh-CN/docs/Web/API/Event/preventDefault",
    difficulty: "beginner"
  }
];

console.log(`前端简单题: ${frontendBeginner.length}道`);

// 导出题目供后续使用
export { frontendBeginner };
