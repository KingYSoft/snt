# sjc_vuetify 登录与权限配置流程

## 一、整体架构

```
登录获取 token → fetchAppConfig 获取全部配置 → 解析权限/菜单/用户信息 → 渲染页面
```

核心思想：**所有用户数据、权限、菜单均从 `/app/all/config` 单一接口获取**，无需单独的用户信息接口。

---

## 二、登录流程

**文件：** `src/pages/login.vue`

### 2.1 登录步骤

```javascript
const loginRealHandle = async () => {
  loading.value = true;
  try {
    // 1. 调用登录接口，只返回 access_token
    const { data } = await login({
      email: email.value,
      password: pwd.value
    });

    if (data && data.access_token) {
      // 2. 存储 token 到 sessionStorage
      sessionStorage.setItem('token', data.access_token);
      // 3. 记住邮箱到 localStorage
      localStorage.setItem('email', email.value);

      // 4. 初始化应用（设置语言/主题，并触发 fetchAppConfig）
      appInit();

      // 5. 跳转页面
      const redirect = route.query.redirect;
      if (redirect) {
        router.replace({ path: redirect });
      } else {
        // 跳转到第一个可用菜单路径，无菜单则跳 404
        router.replace({ path: appStore.firstMenuPath || '/404' });
      }
    }
  } catch (error) {
    console.error('Login failed:', error);
  } finally {
    loading.value = false;
  }
};
```

### 2.2 登录接口

- **URL：** `POST /user/login`
- **请求：** `{ email, password }`
- **响应：** `{ access_token: string }` — 只返回 token，不返回用户信息

### 2.3 存储策略

| 数据    | 存储位置         | 说明                 |
| ------- | ---------------- | -------------------- |
| `token` | `sessionStorage` | 关闭浏览器即失效     |
| `email` | `localStorage`   | 记住邮箱用于下次登录 |

---

## 三、应用初始化流程

**文件：** `src/App.vue`

### 3.1 appInit 函数

```javascript
const appInit = callback => {
  appStore.closeMessage();

  // 1. 设置语言（从 localStorage 读取，默认 en）
  const lang = localStorage.getItem('lang') || 'en';
  current.value = lang;
  document.documentElement.lang = lang === 'zhHans' ? 'zh-CN' : 'en';

  // 2. 设置主题（从 localStorage 读取，默认 light）
  const tTheme = localStorage.getItem('theme');
  if (tTheme === 'light' || tTheme === 'dark') {
    theme.change(tTheme);
  }

  // 3. 执行回调（通常是 reload → fetchAppConfig）
  if (callback && appStore.utils.isFunction(callback)) {
    callback();
  }
};
```

### 3.2 reload 函数

```javascript
const reload = () => {
  appInit(() => {
    appStore.fetchAppConfig(() => {
      nextTick(() => {
        // 通过切换 appAlive 触发组件重新渲染
        appStore.appAlive = false;
        setTimeout(() => {
          appStore.appAlive = true;
        }, 10);
      });
    });
  });
};
```

### 3.3 调用时机

| 场景       | 调用方式                                                    |
| ---------- | ----------------------------------------------------------- |
| 应用启动   | `appInit(() => reload())` — App.vue mounted 时              |
| 登录成功后 | `appInit()` — 不传回调，跳转后由路由守卫触发 fetchAppConfig |
| 刷新页面   | 由路由守卫 `beforeEach` 自动触发                            |

---

## 四、fetchAppConfig 配置获取流程

**文件：** `src/stores/app.js`

### 4.1 接口信息

- **URL：** `GET /app/all/config`
- **响应结构：**

```json
{
  "data": {
    "multiTenancy": { ... },
    "session": { "userId": "...", "tenantId": 1 },
    "localization": { ... },
    "features": { ... },
    "auth": {
      "allPermissions": {},
      "grantedPermissions": {
        "Permission.Business.Booking": "true",
        "Permission.System.User": "true",
        "Permission.Document.Upload": "false"
      }
    },
    "nav": {
      "menus": {
        "MainMenu": {
          "name": "MainMenu",
          "displayName": "Main menu",
          "items": [ ... ]
        }
      }
    },
    "custom": {
      "defaultSourceName": "Sjc",
      "userSession": {
        "user_id": 1,
        "login_name": "zhangsan",
        "full_name": "Zhang San",
        "email_address": "zhangsan@sjc.com",
        "company_id": 1,
        "company_pk": "guid",
        "company_code": "SJ",
        "company_name": "SJC Company",
        "branch_id": 1,
        "branch_pk": "guid",
        "branch_code": "SZ",
        "branch_name": "Shenzhen"
      },
      "appComboboxConfig": { ... }
    }
  }
}
```

### 4.2 fetchAppConfig 处理逻辑

```javascript
async fetchAppConfig(callback) {
  if (this.configLoading) return; // 防重复请求

  try {
    this.configLoading = true;
    const { data } = await appAllConfig();

    if (data) {
      // 1. 存储完整配置
      this.setAppConfig(data);

      // 2. 根据权限生成菜单
      const appMenus = getMenus(routes);
      this.setAppMenus(appMenus, allMenus);

      // 3. 执行回调
      if (callback) callback(data);
    }
  } catch (error) {
    console.log(error);
  } finally {
    this.configLoading = false;
  }
}
```

### 4.3 setAppConfig

```javascript
setAppConfig(data) {
  if (data) {
    this.config = { ...data };
    if (data.custom?.defaultSourceName) {
      this.defaultSourceName = data.custom.defaultSourceName;
    }
  }
}
```

整个 config 对象直接存储到 store 的 `config` 状态中，所有子模块通过 getter 访问。

---

## 五、权限系统

### 5.1 权限数据来源

来自 `/app/all/config` 响应中的 `data.auth.grantedPermissions`：

```json
{
  "grantedPermissions": {
    "Permission.Root": "true",
    "Permission.Business.Booking": "true",
    "Permission.Business.Shipment": "true",
    "Permission.System.User": "false"
  }
}
```

键为权限名称，值为 `"true"` 或 `"false"`（字符串）。

### 5.2 权限检查方法

```javascript
// store getter
auth: state => ({
  isGranted: permissionName => {
    // 优先从 config.auth.grantedPermissions 检查
    if ((state.config.auth.grantedPermissions[permissionName] ?? '').toLowerCase() === 'true') {
      return true;
    }
    // 降级从 sessionStorage 检查
    if ((JSON.parse(sessionStorage.getItem('auth') ?? '{}')[permissionName] ?? '').toLowerCase() === 'true') {
      return true;
    }
    return false;
  }
});
```

**检查优先级：**

1. `state.config.auth.grantedPermissions[permissionName]` — 从已加载的配置中检查
2. `sessionStorage.getItem('auth')` — 降级方案，避免未加载配置时无法检查

### 5.3 使用方式

```javascript
// 在组件中检查权限
const appStore = useAppStore();

// 单个权限
if (appStore.auth.isGranted('Permission.Business.Booking')) {
  // 显示预订功能
}

// 路由守卫中检查
if (to.meta.permissions) {
  const hasPermission = appStore.auth.isGranted(to.meta.permissions);
  if (!hasPermission) {
    return { name: '401', replace: true };
  }
}
```

---

## 六、菜单生成流程

### 6.1 菜单数据来源

菜单 **不是直接使用** API 返回的 `nav.menus.MainMenu.items`，而是 **从前端路由定义 + 权限检查动态生成**。

### 6.2 菜单生成逻辑

```javascript
// 在 fetchAppConfig 内部
const getMenus = items => {
  const newMenus = [];

  items.forEach(v => {
    if (v.name && !v.children.length && v.menu === true) {
      const menu = {
        code: v.name,
        title: i18n.t(`$vuetify.custom.menuPage.${v.name}`),
        icon: v.icon,
        order: v.order ?? 99,
        path: v.path,
        children: []
      };

      // 权限过滤
      let pass = true;
      if (v.meta.permissions) {
        pass = appStore.auth.isGranted(v.meta.permissions);
      }

      // UAT 环境排除某些菜单
      if (excludeName.includes(v.name)) {
        pass = false;
      }

      if (pass) {
        newMenus.push(menu);
      }
    }
  });

  // 按 order 排序
  return newMenus.sort((a, b) => a.order - b.order);
};
```

### 6.3 菜单生成规则

| 条件                 | 说明                                 |
| -------------------- | ------------------------------------ |
| `v.menu === true`    | 路由必须标记为菜单项                 |
| `!v.children.length` | 只处理叶子路由                       |
| `v.meta.permissions` | 如果路由定义了权限，检查用户是否拥有 |
| `excludeName`        | UAT 环境排除的菜单列表               |
| `v.order`            | 排序权重，默认 99                    |

### 6.4 菜单渲染组件

- `LayoutMenu.vue` — 递归菜单容器
- `LayoutMenuItem.vue` — 单个菜单项
- `LayoutSubMenuItem.vue` — 带子菜单的菜单项

---

## 七、路由守卫流程

**文件：** `src/router/index.js`

```javascript
router.beforeEach(async to => {
  const appStore = useAppStore();
  appStore.appLoading = true;

  if (to.meta.requiresAuth) {
    // 1. 获取应用配置（内部有防重复请求）
    await appStore.fetchAppConfig();

    // 2. 检查 token
    const token = sessionStorage.getItem('token');
    if (token) {
      // 3. 检查路由权限
      let pass = true;
      if (to.meta.permissions) {
        pass = appStore.auth.isGranted(to.meta.permissions);
        if (!pass) {
          return { name: '401', replace: true };
        }
      }
      return true;
    } else {
      // 4. 无 token 跳转登录
      return { name: 'login', query: { redirect: to.fullPath }, replace: true };
    }
  }

  // 非认证页面直接放行
  return true;
});
```

---

## 八、用户信息访问

### 8.1 userSession getter

```javascript
userSession: state => ({
  session: () => state.config.custom?.userSession || {},

  currentCompanyPK: () => state.config.custom?.userSession?.company_pk,
  currentBranchPK: () => state.config.custom?.userSession?.branch_pk,

  nameInitials: () => {
    const us = state.config.custom?.userSession;
    const name = us?.login_name || us?.email_address || '';
    return name ? name.charAt(0).toUpperCase() : '';
  }
});
```

### 8.2 使用方式

```javascript
const appStore = useAppStore();

// 获取用户信息
const session = appStore.userSession.session();
const userName = session.full_name;
const email = session.email_address;
const company = session.company_name;
const branch = session.branch_name;
```

---

## 九、完整时序图

```
用户点击登录
    │
    ▼
POST /user/login → { access_token }
    │
    ▼
sessionStorage.setItem('token', access_token)
localStorage.setItem('email', email)
    │
    ▼
appInit() → 设置语言/主题
    │
    ▼
router.replace(redirect || firstMenuPath)
    │
    ▼
路由守卫 beforeEach 触发
    │
    ├─ to.meta.requiresAuth?
    │   │
    │   ▼
    │  fetchAppConfig() ← GET /app/all/config
    │   │
    │   ├─ setAppConfig(data) → 存储完整配置
    │   ├─ getMenus(routes) → 根据权限生成菜单
    │   │   └─ auth.isGranted(permission) → 检查 grantedPermissions
    │   └─ setAppMenus(menus)
    │
    ├─ sessionStorage.getItem('token') 存在?
    │   │
    │   ▼
    │  to.meta.permissions? → isGranted() → 401 或放行
    │
    └─ 渲染页面
```

---

## 十、soybean-admin 对接要点

### 10.1 需要对齐的关键点

| 功能       | sjc_vuetify 实现                 | soybean-admin 需要  |
| ---------- | -------------------------------- | ------------------- |
| 登录接口   | 只返回 `access_token`            | 已对齐              |
| token 存储 | `sessionStorage`                 | 已对齐              |
| 用户信息   | `config.custom.userSession`      | 需从 app store 读取 |
| 权限检查   | `auth.isGranted(permissionName)` | 需实现              |
| 菜单生成   | 路由定义 + 权限过滤              | 需适配              |
| 配置加载   | 路由守卫中 `fetchAppConfig()`    | 已部分实现          |
| 登录后跳转 | `redirect \|\| firstMenuPath`    | 需适配              |

### 10.2 建议实现优先级

1. **权限检查方法** — 在 app store 中实现 `isGranted(permissionName)` 方法
2. **菜单权限过滤** — 根据 `grantedPermissions` 过滤菜单
3. **登录后跳转** — 使用 `redirect || firstMenuPath` 逻辑
4. **路由权限守卫** — 路由 meta 中添加 permissions 字段，守卫中检查
