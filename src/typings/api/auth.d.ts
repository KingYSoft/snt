declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "user"
   */
  namespace Auth {
    interface LoginResponse {
      accessToken: string;
    }

    interface LoginToken {
      token: string;
      refreshToken: string;
    }

    interface UserInfo {
      userId: string;
      userName: string;
      email_address?: string;
      roles: string[];
      buttons: string[];
    }
  }

  /**
   * namespace App
   *
   * backend api module: "app"
   */
  namespace App {
    interface ApiResponse<T = any> {
      errCode: number;
      data: T;
      msg?: string;
    }

    interface UserSession {
      user_id?: number;
      login_name?: string;
      full_name?: string;
      email_address?: string;
      short_code?: string;
      work_phone?: string;
      mobile_phone?: string;
      company_id?: number;
      company_pk?: string;
      company_code?: string;
      company_name?: string;
      branch_id?: number;
      branch_pk?: string;
      branch_code?: string;
      branch_name?: string;
      branch_country_code?: string;
      branch_internal_code?: string;
      dept_id?: number;
      dept_pk?: string;
      dept_code?: string;
      dept_desc?: string;
      roles?: string[];
      [key: string]: any;
    }

    interface NavMenuItem {
      name?: string;
      displayName?: string;
      path?: string;
      icon?: string;
      order?: number;
      customData?: any;
      items?: NavMenuItem[];
      children?: NavMenuItem[];
      [key: string]: any;
    }

    interface NavConfig {
      menus?: {
        MainMenu?: {
          name?: string;
          displayName?: string;
          customData?: any;
          items?: NavMenuItem[];
        };
        [key: string]: any;
      };
    }

    interface AuthConfig {
      allPermissions?: Record<string, any>;
      grantedPermissions?: Record<string, string>;
    }

    interface AppConfig {
      multiTenancy?: any;
      session?: any;
      localization?: any;
      features?: any;
      auth?: AuthConfig;
      nav?: NavConfig;
      setting?: any;
      clock?: any;
      timing?: any;
      security?: any;
      custom?: {
        defaultSourceName?: string;
        userSession?: UserSession;
        appComboboxConfig?: any;
        [key: string]: any;
      };
      [key: string]: any;
    }
  }
}
