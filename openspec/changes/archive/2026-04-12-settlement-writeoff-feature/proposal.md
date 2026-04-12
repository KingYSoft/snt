## Why

当前销账创建表单使用了 `queryOrganizationPage` API 来选择结算单位（公司），但该 API 返回的数据结构与实际需求不匹配。需要改用 `queryCompanyPage` API 以获取正确的公司列表和数据格式。

## What Changes

- 将结算单位选择器从 `queryOrganizationPage` API 更改为 `queryCompanyPage` API
- 更新 API 调用方式：从 GET 请求改为 POST 请求，参数通过 `data` 传递
- **公司选择器以表格下拉形式渲染**，显示多列信息（序号、名称、英文名、缩写、代码）
- 调整数据处理逻辑以适配新 API 的响应格式
- 更新相关的类型定义和接口

## Capabilities

### Modified Capabilities

- `settlement-writeoff-create`: 更改公司选择器使用的 API 接口和数据处理逻辑

## Impact

- **修改文件**: `src/views/settlement/writeoff-create/index.vue`
- **修改文件**: `src/service/api/business/settlement.ts`（可能需要添加类型定义）
- **API 变更**: `queryOrganizationPage` → `queryCompanyPage`
- **请求方法变更**: GET → POST
- **参数传递变更**: `params` → `data`
