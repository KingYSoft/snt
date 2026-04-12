## MODIFIED Requirements

### Requirement: 选择结算单位（公司）

系统应允许用户使用公司 API（`queryCompanyPage`）选择结算单位（公司），并以表格形式展示公司信息。

#### Scenario: 搜索和选择公司

- **WHEN** 用户打开公司选择器下拉框
- **THEN** 系统显示来自公司 API（`/company/query-page`）的可搜索公司列表
- **AND** API 使用 POST 方法，参数通过 data 传递
- **AND** 公司选项以表格形式展示，包含以下列：
  - `#` - 序号
  - `Name` - 公司名称
  - `Name(English)` - 英文名称
  - `Abbreviation` - 缩写
  - `Code` - 公司代码

#### Scenario: 选择公司后的展示

- **WHEN** 用户从下拉表格中选择一个公司
- **THEN** 系统在输入框中显示该公司名称（Name 字段）
- **AND** 输入框保持可编辑状态，带下拉箭头指示可重新选择

#### Scenario: 公司选择触发余额查询

- **WHEN** 用户选择一个公司
- **THEN** 系统获取并显示该公司的结欠余额列表

### Requirement: 展示结欠余额列表

系统应以表格形式展示所选公司的结欠余额明细，支持搜索、过滤和多选功能。

#### Scenario: 显示结欠余额表格

- **WHEN** 用户选择一个公司
- **THEN** 系统显示结欠余额明细表格，包含以下列：
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

#### Scenario: 搜索和过滤功能

- **WHEN** 用户在搜索栏输入条件并点击搜索
- **THEN** 系统根据搜索条件过滤结欠余额列表
- **AND** 用户可以选择费用币种进行过滤
- **AND** 用户可以展开"More"查看更多过滤条件
- **AND** 用户可以切换"Show Checked Only"仅显示已选项

#### Scenario: 多选功能

- **WHEN** 用户勾选表格行的复选框
- **THEN** 系统标记该行为已选中状态
- **AND** 系统实时更新已选项目的合计金额

#### Scenario: 操作按钮

- **WHEN** 用户点击"Verification by Fee Details"
- **THEN** 系统按费用详情核对选中项目
- **WHEN** 用户点击"Auto Match"
- **THEN** 系统自动匹配选中的明细项目
- **WHEN** 用户点击"Set Value"
- **THEN** 系统设定选中项目的值

### Requirement: 银行交易记录输入

系统应提供完整的银行交易记录输入功能，包括银行账户、付款信息和金额字段。

#### Scenario: 输入银行交易信息

- **WHEN** 用户填写银行交易记录
- **THEN** 系统显示以下字段：
  - `Bank Account` - 银行账户下拉选择（格式：账号(币种) | 银行名称）
  - `Payment Date` - 付款日期选择器
  - `Serial number` - 序列号输入框
  - `Cheque No.` - 支票号输入框
  - `Payment Amount` - 付款金额输入框
  - `Balance` - 余额显示（根据已选明细计算）
  - `Other Fees` - 其他费用输入框（带编辑图标）

#### Scenario: 余额自动计算

- **WHEN** 用户选择明细项目
- **THEN** 系统自动计算并显示余额（Balance）
- **AND** 余额等于已选明细的合计欠款金额

### Requirement: 汇率和金额计算

系统应支持汇率计算和金额转换，提供两种汇率选项。

#### Scenario: 汇率选项选择

- **WHEN** 用户选择汇率选项
- **THEN** 系统提供以下选项：
  - `Write off at reference Ex. Rate` - 使用参考汇率
  - `Bill Ex. Rate` - 使用账单汇率（默认选中）

#### Scenario: 金额自动计算

- **WHEN** 用户输入已结算金额（Settled Amount）和汇率
- **THEN** 系统自动计算转换后金额（Converted Amount = Settled Amount × Exchange Rate）
- **AND** 系统显示总金额（Total = Converted Amount）

#### Scenario: 总金额包含其他费用

- **WHEN** 用户输入其他费用（Other Fees）
- **THEN** 系统更新总金额（Total = Converted Amount + Other Fees）

### Requirement: 附件上传

系统应支持上传银行回单附件。

#### Scenario: 上传银行回单

- **WHEN** 用户点击附件上传按钮
- **THEN** 系统打开文件选择对话框
- **AND** 用户可以选择并上传银行回单文件
