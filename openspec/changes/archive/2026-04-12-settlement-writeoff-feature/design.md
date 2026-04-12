## Context

销账创建表单目前使用 `queryOrganizationPage` API 来选择结算单位。该 API 来自 `src/service/api/maintain/organization`，主要用于组织管理模块。然而，实际的公司选择应使用 `queryCompanyPage` API，该 API 是专门为公司查询设计的端点。

**当前实现问题：**

- Organization API 返回的数据结构与公司选择需求不完全匹配
- Organization API 是 GET 请求，而 Company API 是 POST 请求
- 两者参数传递方式不同（`params` vs `data`）

**目标 API：**

```javascript
export const queryCompanyPage = params => service({ url: '/company/query-page', method: 'post', data: params });
```

## Goals / Non-Goals

**Goals:**

- 将公司选择器切换到使用 `queryCompanyPage` API
- 确保 API 调用方式正确（POST 请求，data 传参）
- 更新结欠余额列表以支持搜索、过滤和多选功能
- 保持现有的用户交互体验

**Non-Goals:**

- 不修改结欠余额 API 调用（仅更新前端展示）
- 不修改明细项目 API 调用
- 不修改银行选择器（仍使用 queryBankPage）

## Decisions

### 直接替换 API 调用

**选择**：直接将 `queryOrganizationPage` 替换为 `queryCompanyPage`，并更新相关调用逻辑。

**理由**：

- 功能对等，两者都提供分页查询能力
- 最小化变更范围，降低引入 bug 的风险
- 保持代码结构清晰

**实现细节：**

- 导入 `queryCompanyPage` 而非 `queryOrganizationPage`
- 移除 `queryOrganizationPage` 导入
- 调整 API 调用参数格式以匹配新 API

### 公司选择器 UI 渲染方式

**选择**：使用 NaiveUI 的 `NSelect` 组件的 `render` 功能或 `NDataTable` 嵌入下拉，展示表格形式的公司列表。

**理由**：

- 用户期望看到详细的公司信息（名称、英文名、缩写、代码）
- 表格格式便于快速识别和选择公司
- 参考现有 UI 设计（图片显示的格式）

**显示列：**

- `#` - 序号
- `Name` - 公司名称
- `Name(English)` - 英文名称
- `Abbreviation` - 缩写
- `Code` - 公司代码

**选择后的展示字段：**

- 主要显示：**公司名称**（Name 字段）
- 例如：选择 "海阳市华都制衣有限公司" 后，输入框显示该公司名称
- 输入框保持可编辑状态，带下拉箭头，支持重新选择
- 如果用户需要在界面上看到公司代码，可以在标签或提示中显示

**实现方案：**

- 方案 1：使用 `NSelect` 的 `render-label` 和 `render-tag` 自定义选项渲染
- 方案 2：使用 `NPopselect` + `NDataTable` 组合实现表格下拉
- 方案 3：使用 `NSelect` 的 `render-option` 插槽自定义选项

推荐使用 **方案 2**（NPopselect + NDataTable），因为：

- 更灵活的表格展示能力
- 支持分页显示
- 更好的性能（大数据量）

### 结欠余额列表展示

**表格列：**

- `Checkbox` - 多选复选框
- `Job No.` - 工作单号
- `Tax Invoice No.` - 税务发票号
- `Bill No.` - 账单号
- `Billing Date` - 账单日期
- `Fee` - 费用类型
- `Original Currency` - 原币种
- `Original Outstanding Amount` - 原币种欠款金额
- `Settled Amount (Original Currency)` - 原币种已结算金额
- `Symbol` - 货币符号
- `Ex. Rate` - 汇率
- `Settled Amount (Converted)` - 转换后已结算金额
- `Converted Currency` - 转换后币种

**搜索和过滤功能：**

- 搜索字段选择器（默认 "Statement No."）
- 搜索输入框
- 费用币种下拉选择
- "More" 展开更多过滤条件
- "Show Checked Only" 切换按钮（显示仅已选中项）

**操作按钮：**

- "Verification by Fee Details" - 按费用详情核对
- "Auto Match" - 自动匹配
- "Set Value" - 设定值

### 银行及金额输入区域布局

**左侧面板 - Bank Transaction Record（银行交易记录）：**

- `Bank Account` - 银行账户下拉选择（格式：账号(币种) | 银行名称）
- `Payment Date` - 付款日期选择器
- `Serial number` - 序列号输入框
- `Cheque No.` - 支票号输入框
- `Payment Amount` - 付款金额输入框（默认 0.00）
- `Balance` - 余额显示（根据已选明细计算，可为负数）
- `Other Fees` - 其他费用输入框（带编辑图标，默认 0）

**右侧面板 - Bill Ex. Rate（汇率和金额计算）：**

- 汇率选项单选按钮：
  - `Write off at reference Ex. Rate` - 使用参考汇率销账
  - `Bill Ex. Rate` - 使用账单汇率销账（默认选中）
- `Original Currency` - 原币种显示（如 CNY）
- `Settled Amount` - 已结算金额输入框
- `Conv.` - 转换操作下拉（如乘号 "×"）
- `Reference Ex. Rate` - 参考汇率输入框（如 1.000000）
- `Converted Amount` - 转换后金额显示（自动计算）
- `Total` - 总金额显示（等于转换后金额）

**附件上传区域：**

- `Bank Slip Attachment` - 银行回单附件上传按钮（带回形针图标）

### 金额计算规则

**计算逻辑：**

1. **Balance（余额）** = payment amount - 已选明细项目的合计欠款金额
2. **Settled Amount（已结算金额）** = 用户输入的结算金额
3. **Converted Amount（转换后金额）** = Settled Amount × Reference Ex. Rate
4. **Total（总金额）** = Converted Amount + Other Fees
5. **Payment Amount（付款金额）** = 用户实际输入的付款金额

**示例：**

- 已选明细合计：920.50 CNY
- Settled Amount：920.50 CNY
- Exchange Rate：1.000000
- Converted Amount：920.50 CNY (920.50 × 1.0)
- Other Fees：0
- Total：920.50 CNY

### 币种汇率逻辑

币种转换的交互设计和实现。

实现方案总结：

1. 转换逻辑：
   - 表格金额：3000 CNY
   - 选择外币（EUR）+ 汇率（1 EUR = 1.2 CNY）
   - 转换后：3000 / 1.2 = 2500 EUR

2. 自动更新：
   - settledAmount（已结算金额）自动转换为外币金额
   - paymentAmount（付款金额）自动填充转换后的金额
   - balanceAmount（余额）基于外币金额计算

3. 显示优化：
   - 支付信息汇总：同时显示 CNY 和外币金额
   - 汇率和金额计算区域：显示原币种金额和转换信息
   - 清晰展示汇率换算关系

### 参数格式适配

**选择**：保持现有的过滤器格式（`filters: [{ key, op, val }]`），假设新 API 支持相同格式。

**理由**：

- 项目中标准的查询参数格式
- 如果新 API 格式不同，需要额外适配层

## Risks / Trade-offs

### API 响应格式可能不同

**风险**：`queryCompanyPage` 的响应格式可能与 `queryOrganizationPage` 不同。

**缓解措施**：

- 检查新 API 的响应结构
- 如有必要，添加数据转换逻辑
- 使用 TypeScript 类型确保类型安全

### 缺少类型定义

**风险**：`queryCompanyPage` 可能缺少 TypeScript 类型定义。

**缓解措施**：

- 如有需要，添加接口类型定义
- 使用 `as any` 进行临时类型断言（在开发阶段）

### 测试覆盖不足

**风险**：更改 API 后可能未充分测试边界情况。

**缓解措施**：

- 测试空搜索、无结果情况
- 测试搜索、分页功能
- 测试与后续功能（余额查询、明细加载）的集成
