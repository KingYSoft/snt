/** The global namespace for the app */
declare namespace App {
  /** Theme namespace */
  namespace Theme {
    type ColorPaletteNumber = import('@sa/color').ColorPaletteNumber;

    /** NaiveUI theme overrides that can be specified in preset */
    type NaiveUIThemeOverride = import('naive-ui').GlobalThemeOverrides;

    /** Theme setting */
    interface ThemeSetting {
      /** Theme scheme */
      themeScheme: UnionKey.ThemeScheme;
      /** grayscale mode */
      grayscale: boolean;
      /** colour weakness mode */
      colourWeakness: boolean;
      /** Whether to recommend color */
      recommendColor: boolean;
      /** Theme color */
      themeColor: string;
      /** Theme radius */
      themeRadius: number;
      /** Other color */
      otherColor: OtherColor;
      /** Whether info color is followed by the primary color */
      isInfoFollowPrimary: boolean;
      /** Layout */
      layout: {
        /** Layout mode */
        mode: UnionKey.ThemeLayoutMode;
        /** Scroll mode */
        scrollMode: UnionKey.ThemeScrollMode;
      };
      /** Page */
      page: {
        /** Whether to show the page transition */
        animate: boolean;
        /** Page animate mode */
        animateMode: UnionKey.ThemePageAnimateMode;
      };
      /** Header */
      header: {
        /** Header height */
        height: number;
        /** Header breadcrumb */
        breadcrumb: {
          /** Whether to show the breadcrumb */
          visible: boolean;
          /** Whether to show the breadcrumb icon */
          showIcon: boolean;
        };
        /** Multilingual */
        multilingual: {
          /** Whether to show the multilingual */
          visible: boolean;
        };
        globalSearch: {
          /** Whether to show the GlobalSearch */
          visible: boolean;
        };
      };
      /** Tab */
      tab: {
        /** Whether to show the tab */
        visible: boolean;
        /**
         * Whether to cache the tab
         *
         * If cache, the tabs will get from the local storage when the page is refreshed
         */
        cache: boolean;
        /** Tab height */
        height: number;
        /** Tab mode */
        mode: UnionKey.ThemeTabMode;
        /** Whether to close tab by middle click */
        closeTabByMiddleClick: boolean;
      };
      /** Fixed header and tab */
      fixedHeaderAndTab: boolean;
      /** Sider */
      sider: {
        /** Inverted sider */
        inverted: boolean;
        /** Sider width */
        width: number;
        /** Collapsed sider width */
        collapsedWidth: number;
        /** Sider width when the layout is 'vertical-mix', 'top-hybrid-sidebar-first', or 'top-hybrid-header-first' */
        mixWidth: number;
        /**
         * Collapsed sider width when the layout is 'vertical-mix', 'top-hybrid-sidebar-first', or
         * 'top-hybrid-header-first'
         */
        mixCollapsedWidth: number;
        /** Child menu width when the layout is 'vertical-mix', 'top-hybrid-sidebar-first', or 'top-hybrid-header-first' */
        mixChildMenuWidth: number;
        /** Whether to auto select the first submenu */
        autoSelectFirstMenu: boolean;
      };
      /** Footer */
      footer: {
        /** Whether to show the footer */
        visible: boolean;
        /** Whether fixed the footer */
        fixed: boolean;
        /** Footer height */
        height: number;
        /**
         * Whether float the footer to the right when the layout is 'top-hybrid-sidebar-first' or
         * 'top-hybrid-header-first'
         */
        right: boolean;
      };
      /** Watermark */
      watermark: {
        /** Whether to show the watermark */
        visible: boolean;
        /** Watermark text */
        text: string;
        /** Whether to use user name as watermark text */
        enableUserName: boolean;
        /** Whether to use current time as watermark text */
        enableTime: boolean;
        /** Time format for watermark text */
        timeFormat: string;
      };
      /** define some theme settings tokens, will transform to css variables */
      tokens: {
        light: ThemeSettingToken;
        dark?: {
          [K in keyof ThemeSettingToken]?: Partial<ThemeSettingToken[K]>;
        };
      };
    }

    interface OtherColor {
      info: string;
      success: string;
      warning: string;
      error: string;
    }

    interface ThemeColor extends OtherColor {
      primary: string;
    }

    type ThemeColorKey = keyof ThemeColor;

    type ThemePaletteColor = {
      [key in ThemeColorKey | `${ThemeColorKey}-${ColorPaletteNumber}`]: string;
    };

    type BaseToken = Record<string, Record<string, string>>;

    interface ThemeSettingTokenColor {
      /** the progress bar color, if not set, will use the primary color */
      nprogress?: string;
      container: string;
      layout: string;
      inverted: string;
      'base-text': string;
    }

    interface ThemeSettingTokenBoxShadow {
      header: string;
      sider: string;
      tab: string;
    }

    interface ThemeSettingToken {
      colors: ThemeSettingTokenColor;
      boxShadow: ThemeSettingTokenBoxShadow;
    }

    type ThemeTokenColor = ThemePaletteColor & ThemeSettingTokenColor;

    /** Theme token CSS variables */
    type ThemeTokenCSSVars = {
      colors: ThemeTokenColor & { [key: string]: string };
      boxShadow: ThemeSettingTokenBoxShadow & { [key: string]: string };
    };
  }

  /** Global namespace */
  namespace Global {
    type VNode = import('vue').VNode;
    type RouteLocationNormalizedLoaded = import('vue-router').RouteLocationNormalizedLoaded;
    type RouteKey = import('@elegant-router/types').RouteKey;
    type RouteMap = import('@elegant-router/types').RouteMap;
    type RoutePath = import('@elegant-router/types').RoutePath;
    type LastLevelRouteKey = import('@elegant-router/types').LastLevelRouteKey;

    /** The router push options */
    type RouterPushOptions = {
      query?: Record<string, string>;
      params?: Record<string, string>;
      force?: boolean;
    };

    /** The global header props */
    interface HeaderProps {
      /** Whether to show the logo */
      showLogo?: boolean;
      /** Whether to show the menu toggler */
      showMenuToggler?: boolean;
      /** Whether to show the menu */
      showMenu?: boolean;
    }

    /** The global menu */
    type Menu = {
      /**
       * The menu key
       *
       * Equal to the route key
       */
      key: string;
      /** The menu label */
      label: string;
      /** The menu i18n key */
      i18nKey?: I18n.I18nKey | null;
      /** The route key */
      routeKey: RouteKey;
      /** The route path */
      routePath: RoutePath;
      /** The menu icon */
      icon?: () => VNode;
      /** The menu children */
      children?: Menu[];
    };

    type Breadcrumb = Omit<Menu, 'children'> & {
      options?: Breadcrumb[];
    };

    /** Tab route */
    type TabRoute = Pick<RouteLocationNormalizedLoaded, 'name' | 'path' | 'meta'> &
      Partial<Pick<RouteLocationNormalizedLoaded, 'fullPath' | 'query' | 'matched'>>;

    /** The global tab */
    type Tab = {
      /** The tab id */
      id: string;
      /** The tab label */
      label: string;
      /**
       * The new tab label
       *
       * If set, the tab label will be replaced by this value
       */
      newLabel?: string;
      /**
       * The old tab label
       *
       * when reset the tab label, the tab label will be replaced by this value
       */
      oldLabel?: string;
      /** The tab route key */
      routeKey: LastLevelRouteKey;
      /** The tab route path */
      routePath: RouteMap[LastLevelRouteKey];
      /** The tab route full path */
      fullPath: string;
      /** The tab fixed index */
      fixedIndex?: number | null;
      /**
       * Tab icon
       *
       * Iconify icon
       */
      icon?: string;
      /**
       * Tab local icon
       *
       * Local icon
       */
      localIcon?: string;
      /** I18n key */
      i18nKey?: I18n.I18nKey | null;
    };

    /** Form rule */
    type FormRule = import('naive-ui').FormItemRule;

    /** The global dropdown key */
    type DropdownKey = 'closeCurrent' | 'closeOther' | 'closeLeft' | 'closeRight' | 'closeAll' | 'pin' | 'unpin';
  }

  /**
   * I18n namespace
   *
   * Locales type
   */
  namespace I18n {
    type RouteKey = import('@elegant-router/types').RouteKey;

    type LangType = 'en-US' | 'zh-CN';

    type LangOption = {
      label: string;
      key: LangType;
    };

    type I18nRouteKey = Exclude<RouteKey, 'root' | 'not-found'>;

    type FormMsg = {
      placeholder: string;
      required: string;
      invalid: string;
    };

    type Schema = {
      system: {
        title: string;
        updateTitle: string;
        updateContent: string;
        updateConfirm: string;
        updateCancel: string;
      };
      common: {
        action: string;
        add: string;
        addSuccess: string;
        backToHome: string;
        batchDelete: string;
        cancel: string;
        close: string;
        check: string;
        selectAll: string;
        expandColumn: string;
        columnSetting: string;
        config: string;
        confirm: string;
        delete: string;
        deleteSuccess: string;
        confirmDelete: string;
        edit: string;
        warning: string;
        error: string;
        index: string;
        keywordSearch: string;
        logout: string;
        logoutConfirm: string;
        lookForward: string;
        modify: string;
        modifySuccess: string;
        saveSuccess: string;
        modifySuccess: string;
        noData: string;
        operate: string;
        pleaseCheckValue: string;
        refresh: string;
        reset: string;
        save: string;
        search: string;
        switch: string;
        tip: string;
        trigger: string;
        update: string;
        updateSuccess: string;

        userCenter: string;
        view: string;
        op: {
          equal: string;
          notEqual: string;
          contain: string;
          notContain: string;
          startsWith: string;
          endsWith: string;
        };
        yesOrNo: {
          yes: string;
          no: string;
        };
      };
      request: {
        logout: string;
        logoutMsg: string;
        logoutWithModal: string;
        logoutWithModalMsg: string;
        refreshToken: string;
        tokenExpired: string;
      };
      theme: {
        themeDrawerTitle: string;
        tabs: {
          appearance: string;
          layout: string;
          general: string;
          preset: string;
        };
        appearance: {
          themeSchema: { title: string } & Record<UnionKey.ThemeScheme, string>;
          grayscale: string;
          colourWeakness: string;
          themeColor: {
            title: string;
            followPrimary: string;
          } & Record<Theme.ThemeColorKey, string>;
          recommendColor: string;
          recommendColorDesc: string;
          themeRadius: {
            title: string;
          };
          preset: {
            title: string;
            apply: string;
            applySuccess: string;
            [key: string]:
              | {
                  name: string;
                  desc: string;
                }
              | string;
          };
        };
        layout: {
          layoutMode: { title: string } & Record<UnionKey.ThemeLayoutMode, string> & {
              [K in `${UnionKey.ThemeLayoutMode}_detail`]: string;
            };
          tab: {
            title: string;
            visible: string;
            cache: string;
            cacheTip: string;
            height: string;
            mode: { title: string } & Record<UnionKey.ThemeTabMode, string>;
            closeByMiddleClick: string;
            closeByMiddleClickTip: string;
          };
          header: {
            title: string;
            height: string;
            breadcrumb: {
              visible: string;
              showIcon: string;
            };
          };
          sider: {
            title: string;
            inverted: string;
            width: string;
            collapsedWidth: string;
            mixWidth: string;
            mixCollapsedWidth: string;
            mixChildMenuWidth: string;
            autoSelectFirstMenu: string;
            autoSelectFirstMenuTip: string;
          };
          footer: {
            title: string;
            visible: string;
            fixed: string;
            height: string;
            right: string;
          };
          content: {
            title: string;
            scrollMode: { title: string; tip: string } & Record<UnionKey.ThemeScrollMode, string>;
            page: {
              animate: string;
              mode: { title: string } & Record<UnionKey.ThemePageAnimateMode, string>;
            };
            fixedHeaderAndTab: string;
          };
        };
        general: {
          title: string;
          watermark: {
            title: string;
            visible: string;
            text: string;
            enableUserName: string;
            enableTime: string;
            timeFormat: string;
          };
          multilingual: {
            title: string;
            visible: string;
          };
          globalSearch: {
            title: string;
            visible: string;
          };
        };
        configOperation: {
          copyConfig: string;
          copySuccessMsg: string;
          resetConfig: string;
          resetSuccessMsg: string;
        };
      };
      route: Record<I18nRouteKey, string>;
      page: {
        login: {
          common: {
            emailPlaceholder: string;
            loginOrRegister: string;
            userNamePlaceholder: string;
            phonePlaceholder: string;
            codePlaceholder: string;
            passwordPlaceholder: string;
            confirmPasswordPlaceholder: string;
            codeLogin: string;
            confirm: string;
            back: string;
            validateSuccess: string;
            loginSuccess: string;
            welcomeBack: string;
          };
          pwdLogin: {
            title: string;
            rememberMe: string;
            forgetPassword: string;
            register: string;
            otherAccountLogin: string;
            otherLoginMode: string;
            superAdmin: string;
            admin: string;
            user: string;
          };
          codeLogin: {
            title: string;
            getCode: string;
            reGetCode: string;
            sendCodeSuccess: string;
            imageCodePlaceholder: string;
          };
          register: {
            title: string;
            agreement: string;
            protocol: string;
            policy: string;
          };
          resetPwd: {
            title: string;
          };
          bindWeChat: {
            title: string;
          };
        };
        home: {
          branchDesc: string;
          greeting: string;
          weatherDesc: string;
          projectCount: string;
          todo: string;
          message: string;
          downloadCount: string;
          registerCount: string;
          schedule: string;
          study: string;
          work: string;
          rest: string;
          entertainment: string;
          visitCount: string;
          turnover: string;
          dealCount: string;
          projectNews: {
            title: string;
            moreNews: string;
            desc1: string;
            desc2: string;
            desc3: string;
            desc4: string;
            desc5: string;
          };
          creativity: string;
        };
        maintain: {
          currency: {
            code: string;
            symbol: string;
            desc: string;
          };
          packageTypes: {
            code: string;
            description: string;
            isActive: string;
          };
          serviceLevel: {
            code: string;
            description: string;
            isActive: string;
          };
          commodities: {
            code: string;
            description: string;
            isForwarding: string;
            isShipping: string;
            isActive: string;
            isHazardous: string;
          };
          vessel: {
            vesselName: string;
            shippingProvider: string;
            lloydsImo: string;
            vesselType: string;
            callSign: string;
            isActive: string;
          };
          portCode: {
            rlCode: string;
            rlPortName: string;
            rlIata: string;
            rlCountryCode: string;
            rlHasAirport: string;
            rlHasSeaport: string;
            rlHasRail: string;
            rlHasTerminal: string;
          };
          containers: {
            code: string;
            description: string;
            mode: string;
            containerType: string;
            iataClass: string;
            teu: string;
            height: string;
            length: string;
            width: string;
            grossWeight: string;
            tareWeight: string;
            capacityM3: string;
            iso: string;
            isoType: string;
            isoSize: string;
            isoDescription: string;
            isActive: string;
          };
          airlines: {
            airlineNumericCode: string;
            threeLetterCode: string;
            twoCharCode: string;
            airlineName1: string;
            airlineName2: string;
            airlineCity: string;
            airlineState: string;
            postcode: string;
            airlineCountryRegion: string;
            addressLine1: string;
            addressLine2: string;
            cassControlled: string;
            isActive: string;
          };
          bank: {
            code: string;
            description: string;
            bankName: string;
            accountNumber: string;
            currency: string;
            accountType: string;
            abbreviation: string;
            accountEft: string;
            glAccount: string;
            bankAddress: string;
            branch: string;
            company: string;
            swiftCode: string;
            isActive: string;
          };
          shippingLines: {
            code: string;
            name: string;
            isNvo: string;
            oceanCarrierMessaging: string;
            globalSailingSchedule: string;
            containerAutomation: string;
            eSi: string;
            eVgm: string;
            eSo: string;
            eManifest: string;
            isActive: string;
          };
          chargeCode: {
            code: string;
            description: string;
            localLanguageDescription: string;
            isActive: string;
            type: string;
            margin: string;
            tax: string;
            withholding: string;
            calculator: string;
            printSequence: string;
          };
          organization: {
            code: string;
            name: string;
            shortName: string;
            desc: string;
            address1: string;
            address2: string;
            address3: string;
            city: string;
            state: string;
            postal: string;
            country: string;
            phone: string;
            fax: string;
            email: string;
            website: string;
            unloco: string;
            tin: string;
            isActive: string;
            types: string;
            isShipper: string;
            isConsignee: string;
            isCarrier: string;
            isBroker: string;
            isWarehouse: string;
            isTransportClient: string;
            isAgent: string;
            isTempAccount: string;
            categories: string;
            isPayable: string;
            isReceivable: string;
            address: string;
            addressName: string;
            addressType: string;
            companyName: string;
            contacts: string;
            contactName: string;
            position: string;
            mobile: string;
            officePhone: string;
            socialMediaId: string;
            generalInfo: string;
          };
        };
        business: {
          shipment: {
            table: {
              shipmentNo: string;
              shipperName: string;
              consignee: string;
              destination: string;
              origin: string;
              goodsDescription: string;
              crd: string;
              eta: string;
              etd: string;
              grossWeight: string;
              cbm: string;
              ctns: string;
            };
            messages: {
              exportFailed: string;
              completeRequiredFields: string;
              saveFirst: string;
            };
            export: string;
            menu: {
              merge: string;
              split: string;
              copy: string;
              deactivate: string;
              reopen: string;
              exportRow: string;
              batchPrint: string;
            };
            tab: {
              shipment: string;
              additionalDetails: string;
              routing: string;
              billing: string;
              eDocs: string;
              logs: string;
            };
            dialog: {
              shipmentNotExists: {
                title: string;
                message: string;
                newShipment: string;
              };
            };
            form: {
              shipperName: string;
              consigneeName: string;
              transportMode: string;
              packingMode: string;
              origin: string;
              destination: string;
              etd: string;
              cargoReady: string;
              inco: string;
              freightTerms: string;
              releaseType: string;
              volumeWeight: string;
              chargeableWeight: string;
              grossWeight: string;
              volume: string;
              totalPackage: string;
              required: string;
              numericRequired: string;
            };
            section: {
              notifyParty: string;
              notifyParty1: string;
              additionalDetails: string;
              consolidation: string;
              voyageDetails: string;
            };
            billing: {
              grossProfitMargin: string;
              arAmount: string;
              apAmount: string;
              profit: string;
              copyAR: string;
              copyToAP: string;
              copyAP: string;
              copyToAR: string;
              generateDraft: string;
              template: string;
              arCompleted: string;
              apCompleted: string;
              confirmDelete: string;
              noRecords: string;
              selectRecords: string;
              allLocked: string;
              copySuccess: string;
              deleteSuccess: string;
              draftSuccess: string;
            };
            address: {
              newShipper: string;
              newConsignee: string;
              newAddress: string;
              companyName: string;
              code: string;
              shortCode: string;
              contact: string;
              phone: string;
              email: string;
              address1: string;
              address2: string;
              address3: string;
              city: string;
              state: string;
              postalCode: string;
              countryCode: string;
              saveSuccess: string;
              saveFailed: string;
            };
            edoc: {
              selectDocType: string;
              uploadSuccess: string;
              uploadFailed: string;
            };
          };
        };
        settlement: {
          writeoff: {
            title: string;
            addWriteoff: string;
            writeoffNo: string;
            companyName: string;
            amount: string;
            currency: string;
            writeoffDate: string;
            status: string;
            statusDraft: string;
            statusSubmitted: string;
            statusApproved: string;
            statusRejected: string;
            createdAt: string;
            remark: string;
            actions: string;
            view: string;
            searchPlaceholder: string;
            filterByWriteoffNo: string;
            filterByCompanyName: string;
            filterByStatus: string;
            noData: string;
            create: {
              title: string;
              settlementUnit: string;
              outstandingBalance: string;
              selectCompany: string;
              writeoffDetails: string;
              writeoffAmount: string;
              bank: string;
              selectBank: string;
              selectCurrency: string;
              exchangeRate: string;
              convertedAmount: string;
              paymentMethod: string;
              referenceNo: string;
              remark: string;
              remarkPlaceholder: string;
              referenceNoPlaceholder: string;
              wireTransfer: string;
              check: string;
              cash: string;
              other: string;
              selectedTotal: string;
              pleaseSelectCompany: string;
              pleaseSelectDetails: string;
              amountMustBePositive: string;
              saveSuccess: string;
              selectItemsFirst: string;
              // New fields
              searchCompany: string;
              pleaseSelectCompany2: string;
              pleaseSelectCurrency: string;
              pleaseSelectPaymentMethod: string;
              settlementAmountMustBePositive: string;
              uploadSuccess: string;
              bankTransactionRecord: string;
              bankAccount: string;
              selectBankAccount: string;
              paymentDate: string;
              serialNumber: string;
              chequeNo: string;
              paymentAmount: string;
              balance: string;
              otherFees: string;
              exchangeRateAndAmount: string;
              billExRate: string;
              writeOffAtReferenceExRate: string;
              originalCurrencyAmount: string;
              total: string;
              attachmentUpload: string;
              bankSlipAttachment: string;
              selectFile: string;
              delete: string;
              save: string;
              cancel: string;
              verificationByFeeDetails: string;
              autoMatch: string;
              setValue: string;
              jobNo: string;
              taxInvoiceNo: string;
              billNo: string;
              billingDate: string;
              fee: string;
              originalCurrency: string;
              originalOutstandingAmount: string;
              settledAmountOriginalCurrency: string;
              symbol: string;
              exRate: string;
              settledAmountConverted: string;
              convertedCY: string;
              baseCurrencyAmount: string;
              selectedTotalCNY: string;
              selectedTotalCurrency: string;
              rateInfo: string;
              rateInfo2: string;
              developing: string;
              verificationByFeeDetailsDeveloping: string;
              autoMatchDeveloping: string;
              setValueDeveloping: string;
              search: string;
              reset: string;
              showCheckedOnly: string;
              feeCurrency: string;
              pleaseInput: string;
              companyCode: string;
              companyName: string;
              companyNameEn: string;
              abbreviation: string;
              totalRecords: string;
              currency?: string;
              paymentInfo?: string;
            };
            detail: {
              title: string;
              back: string;
              comingSoon: string;
            };
          };
        };
      };
      form: {
        required: string;
        validationFailed: string;
        userName: FormMsg;
        phone: FormMsg;
        code: FormMsg;
        confirmPwd: FormMsg;
        pwd: FormMsg;
        email: FormMsg;
      };
      dropdown: Record<Global.DropdownKey, string>;
      icon: {
        themeConfig: string;
        themeSchema: string;
        lang: string;
        fullscreen: string;
        fullscreenExit: string;
        reload: string;
        collapse: string;
        expand: string;
        pin: string;
        unpin: string;
      };
      datatable: {
        itemCount: string;
        fixed: {
          left: string;
          right: string;
          unFixed: string;
        };
      };
    };

    type GetI18nKey<T extends Record<string, unknown>, K extends keyof T = keyof T> = K extends string
      ? T[K] extends Record<string, unknown>
        ? `${K}.${GetI18nKey<T[K]>}`
        : K
      : never;

    type I18nKey = GetI18nKey<Schema>;

    type TranslateOptions<Locales extends string> = import('vue-i18n').TranslateOptions<Locales>;

    interface $T {
      (key: I18nKey): string;
      (key: I18nKey, plural: number, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, defaultMsg: string, options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], plural: number): string;
      (key: I18nKey, list: unknown[], defaultMsg: string): string;
      (key: I18nKey, named: Record<string, unknown>, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, named: Record<string, unknown>, plural: number): string;
      (key: I18nKey, named: Record<string, unknown>, defaultMsg: string): string;
    }
  }

  /** Service namespace */
  namespace Service {
    /** Other baseURL key */
    type OtherBaseURLKey = 'demo';

    interface ServiceConfigItem {
      /** The backend service base url */
      baseURL: string;
      /** The proxy pattern of the backend service base url */
      proxyPattern: string;
    }

    interface OtherServiceConfigItem extends ServiceConfigItem {
      key: OtherBaseURLKey;
    }

    /** The backend service config */
    interface ServiceConfig extends ServiceConfigItem {
      /** Other backend service config */
      other: OtherServiceConfigItem[];
    }

    interface SimpleServiceConfig extends Pick<ServiceConfigItem, 'baseURL'> {
      other: Record<OtherBaseURLKey, string>;
    }

    /** The backend service response data */
    type Response<T = unknown> = {
      /** The backend service response code */
      code: string;
      /** The backend service response message */
      msg: string;
      /** The backend service response data */
      data: T;
    };

    /** The demo backend service response data */
    type DemoResponse<T = unknown> = {
      /** The backend service response code */
      status: string;
      /** The backend service response message */
      message: string;
      /** The backend service response data */
      result: T;
    };
  }
}
