import { request } from '@/service/request';

// ==================== Type Definitions ====================

/**
 * Address information
 */
export interface JobDocAddressDto {
  id?: string;
  e2_pk?: string;
  e2_isvalid?: number;
  e2_addresstype?: string;
  e2_isresidential?: number;
  e2_addresssequence?: number;
  e2_oa_address?: string;
  e2_contact?: string;
  e2_addressoverride?: number;
  e2_address1?: string;
  e2_address2?: string;
  e2_city?: string;
  e2_postcode?: string;
  e2_state?: string;
  e2_rn_nkcountrycode?: string;
  e2_phone?: string;
  e2_mobile?: string;
  e2_fax?: string;
  e2_govregnum?: string;
  e2_govregnumtype?: string;
  e2_email?: string;
  e2_parentid?: string;
  e2_parenttablecode?: string;
  e2_validationstatus?: string;
  e2_addressmap?: string;
  e2_suppressaddressvalidationerror?: number;
  e2_systemcreatetimeutc?: string;
  e2_systemcreateuser?: string;
  e2_systemlastedittimeutc?: string;
  e2_systemlastedituser?: string;
  e2_geolocation?: string;
  e2_additionaladdressinformation?: string;
  e2_companyname?: string;
  e2_screeningstatus?: string;
  e2_autoversion?: number;
}

/**
 * Package line information
 */
export interface JobPackLinesDto {
  id?: string;
  jl_pk?: string;
  jl_isvalid?: number;
  jl_freightmode?: string;
  jl_itemno?: number;
  jl_enditemno?: number;
  jl_packagecount?: number;
  jl_f3_nkpacktype?: string;
  jl_containerpackingorder?: number;
  jl_lineprice?: number;
  jl_outturn?: number;
  jl_outturnedlength?: number;
  jl_outturnedheight?: number;
  jl_outturnedwidth?: number;
  jl_outturnedweight?: number;
  jl_outturnedvolume?: number;
  jl_outturncomment?: string;
  jl_pillaged?: number;
  jl_damaged?: number;
  jl_actualweight?: number;
  jl_actualweightuq?: string;
  jl_length?: number;
  jl_height?: number;
  jl_width?: number;
  jl_unitofdimension?: string;
  jl_actualvolume?: number;
  jl_actualvolumeuq?: string;
  jl_loadingmeters?: number;
  jl_description?: string;
  jl_detaileddescription?: string;
  jl_harmonisedcode?: string;
  jl_rn_nkorigin?: string;
  jl_rh_nkcommoditycode?: string;
  jl_marksandnumbers?: string;
  jl_js?: string;
  jl_customattrib1?: string;
  jl_customattrib2?: string;
  jl_customattrib3?: string;
  jl_customattrib4?: string;
  jl_customdecimal1?: number;
  jl_customdecimal2?: number;
  jl_customdate1?: string;
  jl_customdate2?: string;
  jl_customflag1?: number;
  jl_customflag2?: number;
  jl_exportrefnumber?: string;
  jl_importrefnumber?: string;
  jl_vehiclecolor?: string;
  jl_vehiclemake?: string;
  jl_vehiclemodel?: string;
  jl_vehiclenumberofdoors?: number;
  jl_vehicletransmission?: string;
  jl_vehicleyear?: number;
  jl_refnumber?: string;
  jl_autoversion?: number;
  jl_departuretransitwarehouseexcluded?: number;
  jl_lastknowntransitwarehousestatus?: string;
  jl_origintransitwarehousestatus?: string;
  jl_packlineid?: string;
  jl_requiredtemperaturemaximum?: number;
  jl_requiredtemperatureminimum?: number;
  jl_requiredtemperatureunit?: string;
  jl_requirestemperaturecontrol?: number;
  jl_lastknowntransitwarehousestatusdatetime?: string;
  jl_oa_lastknowntransitwarehouseaddress?: string;
  jl_systemcreatetimeutc?: string;
  jl_systemcreateuser?: string;
  jl_systemlastedittimeutc?: string;
  jl_systemlastedituser?: string;
  jl_rc_containertype?: string;
  jl_jl_outerpackline?: string;
  jl_ishighrisk?: number;
  jl_jsl_bookingline?: string;
}

/**
 * Container information
 */
export interface ShipmentDetailContainerDto {
  id?: string;
  jc_pk?: string;
  jc_isvalid?: number;
  jc_iscfsregistered?: number;
  jc_isemptycontainer?: number;
  jc_issealok?: number;
  jc_isshipperowned?: number;
  jc_isdamaged?: number;
  jc_containermode?: string;
  jc_containerjobid?: string;
  jc_containerstatus?: string;
  jc_containerquality?: string;
  jc_rc?: string;
  jc_containernum?: string;
  jc_sealnum?: string;
  jc_additionalsealnum?: string;
  jc_additional2sealnum?: string;
  jc_description?: string;
  jc_harmonisedcode?: string;
  jc_marksandnumbers?: string;
  jc_f3_nkpacktype?: string;
  jc_containerimportdorelease?: string;
  jc_containercount?: number;
  jc_containerstoragelocation?: string;
  jc_stowageposition?: string;
  jc_fclstoragemoduleonlymaster?: string;
  jc_purpose?: string;
  jc_unpackgang?: string;
  jc_unpackshed?: string;
  jc_deliverymode?: string;
  jc_trainwagonnumber?: string;
  jc_oh_cfsclient?: string;
  jc_containerrating?: string;
  jc_oh_shippingline?: string;
  jc_exportdepotcustomsreference?: string;
  jc_packdate?: string;
  jc_releasenum?: string;
  jc_temprecorderserialno?: string;
  jc_departureslotdatetime?: string;
  jc_departureslotreference?: string;
  jc_departuredockreceipt?: string;
  jc_departureestimatedpickup?: string;
  jc_oa_departurecontaineryardaddress?: string;
  jc_emptyrequired?: string;
  jc_containeryardemptypickupgateout?: string;
  jc_departuredeliverybyrail?: number;
  jc_departurecartageadvised?: string;
  jc_departurecartageref?: string;
  jc_departurecartagecomplete?: string;
  jc_arrivalslotdatetime?: string;
  jc_arrivalslotreference?: string;
  jc_arrivalestimateddelivery?: string;
  jc_arrivaldeliveryrequiredby?: string;
  jc_oa_arrivalcontaineryardaddress?: string;
  jc_arrivalpickupbyrail?: number;
  jc_arrivalcartageadvised?: string;
  jc_arrivalcartageref?: string;
  jc_arrivalcartagecomplete?: string;
  jc_fclwharfgatein?: string;
  jc_fclonboardvessel?: string;
  jc_overridefclavailablestorage?: number;
  jc_fclunloadfromvessel?: string;
  jc_fclavailable?: string;
  jc_fclwharfgateout?: string;
  jc_arrivalctostoragestartdate?: string;
  jc_fclheldintransitstaging?: number;
  jc_overridelclavailablestorage?: number;
  jc_lclunpack?: string;
  jc_lclavailable?: string;
  jc_lclstoragecommences?: string;
  jc_emptyreadyforreturn?: string;
  jc_emptyreturnedby?: string;
  jc_containeryardemptyreturngatein?: string;
  jc_rh_nkcontainercommoditycode?: string;
  jc_airventflow?: number;
  jc_airventflowrateunit?: string;
  jc_humiditypercent?: number;
  jc_iscontrolledatmosphere?: number;
  jc_refriggeneratorid?: string;
  jc_setpointtemp?: number;
  jc_setpointtempunit?: string;
  jc_totalheight?: number;
  jc_totallength?: number;
  jc_totalwidth?: number;
  jc_totalunitofmeasure?: string;
  jc_overhangback?: number;
  jc_overhangright?: number;
  jc_dunnageweight?: number;
  jc_grossweight?: number;
  jc_grossweightuq?: string;
  jc_tareweight?: number;
  jc_grossvolume?: number;
  jc_grossvolumeuq?: string;
  jc_volumecapacity?: number;
  jc_volumecapacityuq?: string;
  jc_weightcapacity?: number;
  jc_weightcapacityuq?: string;
  jc_containernotes?: string;
  jc_fclstoragearrivedunderbond?: number;
  jc_fclstorageunderbondcleared?: string;
  jc_deliverysequence?: number;
  jc_jx?: string;
  jc_jk?: string;
  jc_js_fclbookingonlylink?: string;
  jc_vehiclemake?: string;
  jc_vehiclemodel?: string;
  jc_vehicleyear?: number;
  jc_vehiclecolor?: string;
  jc_vehiclenumberofdoors?: number;
  jc_vehicletransmission?: string;
  jc_goodsvalue?: number;
  jc_rx_nkgoodscurrency?: string;
  jc_systemcreateuser?: string;
  jc_systemcreatetimeutc?: string;
  jc_systemlastedituser?: string;
  jc_systemlastedittimeutc?: string;
  jc_additional2sealparty?: string;
  jc_additionalsealparty?: string;
  jc_costspotrate?: number;
  jc_costspotratemode?: string;
  jc_gatewaysellspotrate?: number;
  jc_gatewaysellspotratemode?: string;
  jc_grossweightverificationdatetime?: string;
  jc_grossweightverificationstatus?: string;
  jc_grossweightverificationtype?: string;
  jc_rx_nkcostspotratecurrency?: string;
  jc_rx_nkgatewaysellspotratecurrency?: string;
  jc_rx_nksellspotratecurrency?: string;
  jc_sealparty?: string;
  jc_sellspotrate?: number;
  jc_sellspotratemode?: string;
  jc_emptyreturnreference?: string;
  jc_autoversion?: number;
  jc_importdepotcustomsreference?: string;
  jc_jsb_supplierbooking?: string;
  jc_rca_allocationline?: string;
  jc_isgrossweightoverridden?: number;
  jc_isnonoperativereefer?: number;
  jc_pivotbreak?: number;
  jc_clh_loadlistplan?: string;
  jc_rh_nkratingcommoditycode?: string;
  jc_systemcreatebranch?: string;
  jc_systemcreatedepartment?: string;
}

/**
 * Document data
 */
export interface JobDocumentDataDto {
  id?: string;
  jdd_pk?: string;
  jdd_parenttablecode?: string;
  jdd_parentid?: string;
  jdd_overriddendata?: string;
  jdd_name?: string;
  jdd_template?: string;
  jdd_systemcreatetimeutc?: string;
  jdd_systemcreateuser?: string;
  jdd_systemlastedittimeutc?: string;
  jdd_systemlastedituser?: string;
  jdd_autoversion?: number;
}

/**
 * Shipment list item (from JobShipmentDtoOutput)
 */
export interface ShipmentListItem {
  id?: string | null;
  js_pk?: string;
  js_isvalid?: number;
  js_iscancelled?: number;
  js_shipmentstatus?: string;
  js_phase?: string;
  js_uniqueconsignref?: string;
  js_interimreceipt?: string;
  js_cartagewaybill?: string;
  js_cfsreference?: string;
  js_awbservicelevel?: string;
  js_isneutralmaster?: number;
  js_consolreference?: string;
  js_housebill?: string;
  js_shipmenttype?: string;
  js_isshipping?: number;
  js_isdirectbooking?: number;
  js_iscfsregistered?: number;
  js_isforwardregistered?: number;
  js_isbooking?: number;
  js_transhiptoothercfs?: number;
  js_bookingreference?: string;
  js_a_bkd?: string;
  js_goodsdescription?: string;
  js_goodsvalue?: number;
  js_rx_nkgoodsvaluecurr?: string;
  js_insurancevalue?: number;
  js_rx_nkinsurancecurrency?: string;
  js_shippercodamount?: number;
  js_shippercodpaymethod?: string;
  js_freightspotrateautoratingmode?: string;
  js_freightcostrate?: number;
  js_rx_nkfreightcostratecurrency?: string;
  js_freightcostrateautoratingmode?: string;
  js_gatewayfreightsellrate?: number;
  js_rx_nkgatewayfreightsellratecurrency?: string;
  js_freightgatewaysellrateautoratingmode?: string;
  js_packingorder?: number;
  js_releasetype?: string;
  js_oa_exportreceivingdepot?: string | null;
  js_oa_importreleasedepot?: string | null;
  js_oh_handledonbehalfofforwarder?: string | null;
  js_oh_transhipagent?: string | null;
  js_oh_deliveryagent?: string | null;
  js_a_rcv?: string | null;
  js_rl_nkorigin?: string;
  js_e_dep?: string | null;
  js_rl_nkdestination?: string;
  js_e_arv?: string | null;
  js_clientrequestedeta?: string | null;
  js_rs_nkservicelevel?: string;
  js_inco?: string;
  js_additionalterms?: string;
  js_jx?: string | null;
  js_transportmode?: string;
  js_packingmode?: string;
  js_actualvolume?: number;
  js_documentedvolume?: number;
  js_manifestedvolume?: number;
  js_unitofvolume?: string;
  js_actualweight?: number;
  js_documentedweight?: number;
  js_manifestedweight?: number;
  js_unitofweight?: string;
  js_actualchargeable?: number;
  js_documentedchargeable?: number;
  js_manifestedchargeable?: number;
  js_loadingmeters?: number;
  js_documentedloadingmeters?: number;
  js_manifestedloadingmeters?: number;
  js_unitfreightrate?: number;
  js_rx_nkfrtratecurrency?: string;
  js_totalpackagecount?: number;
  js_f3_nktotalcountpacktype?: string;
  js_outerpacks?: number;
  js_f3_nkpacktype?: string;
  js_nooriginalbills?: number;
  js_nocopybills?: number;
  js_overridewaybilldefaults?: number;
  js_oh_exportbroker?: string | null;
  js_housebillofladingtype?: string;
  js_shippedonboard?: string;
  js_shippedonboarddate?: string | null;
  js_housebillissuedate?: string | null;
  js_hblawbchargesdisplay?: string;
  js_hblcontainerpackmodeoverride?: string;
  js_warehouselocation?: string;
  js_wl?: string | null;
  js_oh_importbroker?: string | null;
  js_visibletabs?: number;
  js_invisibletabsxml?: string;
  js_legacy_support_columns_start?: number;
  js_js_coloadmastershipment?: string | null;
  js_js_splitswitchshipment?: string | null;
  js_issplitshipment?: number;
  js_systemlastedittimeutc?: string | null;
  js_systemlastedituser?: string;
  js_systemcreatetimeutc?: string | null;
  js_systemcreateuser?: string;
  js_attachedorderxmlupdatecutoffdateutc?: string | null;
  js_efreightstatus?: string;
  js_rl_nkhousebillissueplace?: string;
  js_rl_nkplaceofdischarge?: string;
  js_rl_nkplaceofreceipt?: string;
  js_th_onetimequote?: string | null;
  js_rl_nkdischargeport?: string;
  js_rl_nkfreightratedestination?: string;
  js_rl_nkfreightrateorigin?: string;
  js_rl_nkloadport?: string;
  js_screeningstatus?: string;
  js_autoversion?: number;
  js_exportreceivingdepotdispatchrequested?: string | null;
  js_exportreceivingdepotreceiptrequested?: string | null;
  js_importreleasedepotdispatchrequested?: string | null;
  js_importreleasedepotreceiptrequested?: string | null;
  js_ishighrisk?: number;
  js_paymenttermautoratingoverride?: string;
  js_pl_nkcarrierservicelevel?: string;
  js_communitytransitstatus?: string;
  js_oa_bookedshippinglineaddress?: string | null;
  js_housebill_reversed?: string;
  js_uniqueconsignref_reversed?: string;
  js_bookedvesselscreeningstatus?: string;
  js_carriercontractnumber?: string | null;
  js_rca_bookingallocationline?: string | null;
  js_companytariffleveloverride?: number;
  js_fmctariffid?: string;
  js_reviseddeliveryduedate?: string | null;
  js_rh_nkratecommodity?: string;
  js_oh_creditor?: string | null;
  js_rs_nkgatewayservicelevel?: string;
  js_electronicbillofladingreference?: string;
  js_electronicbillofladingstatus?: string;
  js_electronicbillofladingterms?: string;
  js_electronicbillofladingtype?: string;
  js_electronicbillofladingversion?: number;
  js_electronicbillofladinghousebill?: string;
  js_systemcreatebranch?: string;
  js_systemcreatedepartment?: string;
  js_rct_carriercontract?: string | null;
  js_rtt_transittime?: string | null;
  js_deliveryduedate?: string | null;
}

/** GET /shipment/detail — shipper / consignee org address */
export interface ShipmentOrgAddressDto {
  oh_fullname: string;
  oa_pk: string;
  oa_code: string;
  oa_companynameoverride?: string;
  oa_address1: string;
  oa_address2: string;
  oa_city?: string;
  oa_state?: string;
  oa_postcode?: string;
  oa_rn_nkcountrycode?: string;
  oa_phone?: string;
  oa_fax?: string;
  oa_mobile?: string;
  oa_email?: string;
}

/**
 * Shipment detail (extends list item with related data)
 */
export interface ShipmentDetail extends ShipmentListItem {
  shipper?: ShipmentOrgAddressDto;
  consignee?: ShipmentOrgAddressDto;
  notify_party?: ShipmentOrgAddressDto;
  pickup?: JobDocAddressDto;
  delivery?: JobDocAddressDto;
  containers_list?: ShipmentDetailContainerDto[];
  loose_list?: JobPackLinesDto[];
  doc_data?: JobDocumentDataDto;
}

// ==================== Request/Response Types ====================

export interface ShipmentQueryParams {
  skipCount: number;
  maxResultCount: number;
  filters?: Array<{
    key: string;
    op: string;
    val: string;
    start?: string;
    end?: string;
  }>;
}

export interface ShipmentSaveParams {
  id?: number;
  pk?: string;
  shp_transport_mode?: string;
  shipper?: any;
  consignee?: any;
  notify_party?: any;
  containers_list?: any[];
  loose_list?: any[];
  po_lines_list?: any[];
  notes_list?: any[];
  ar_charges?: any[];
  ap_charges?: any[];
  shp_unit_of_weight?: string;
  shp_unit_of_volume?: string;
  shp_transit_time_unit?: string;
  shp_pack_type?: string;
  shp_is_forward_registered?: number;
  doc_data?: any;
  [key: string]: any;
}

export interface ShipmentPdfGenerateParams {
  business_id: number;
  business_pk: string;
  template_code: string;
  version_no: string;
}

export interface ShipmentQueryPortCodeParams {
  query: string;
}

export interface ShipmentTblResponse {
  success: boolean;
  errCode?: number;
  msg?: string;
  data?: {
    items: ShipmentListItem[];
    totalCount: number;
  };
}

export interface ShipmentDetailResponse {
  success: boolean;
  errCode?: number;
  msg?: string;
  data?: ShipmentDetail;
}

export interface BillingChargeLineParams {
  shpPk: string;
  chargeType: string;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface BillingChargeLineItem {
  jr_pk: string;
  jr_jh: string;
  jr_chargetype: string;
  jr_desc: string;
  amount: number;
  os_amount: number;
  currency: string;
  party_oh: string;
  exchange_rate: number;
  gst_rate: string;
  wht_rate: string;
  vat_class: string;
  line_pk: string;
  invoice_pk: string;
  invoice_no: string;
  invoice_date: string;
  draft: string;
}

export interface BillingChargeLinePageResult {
  totalCount: number;
  items: BillingChargeLineItem[];
}

export interface BillingDraftPageParams {
  shpPk: string;
  chargeType: string;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface BillingDraftPageItem {
  id: string;
  oh_fullname: string;
  ah_pk: string;
  ah_ledger: string;
  ah_transactiontype: string;
  ah_transactionnum: string;
  ah_desc: string;
  ah_invoicedate: string;
  ah_duedate: string;
  ah_invoiceamount: number;
  ah_rx_nktransactioncurrency: string;
  ah_postdate: string;
  ah_fullypaiddate: string;
  ah_invoiceterm: string;
  ah_matchstatus: string;
  ah_outstandingamount: number;
  ah_systemcreatebranch: string;
  ah_invoiceapproved: number;
  ah_iscancelled: number;
  ah_oh?: string;
  [key: string]: unknown;
}

export interface BillingDraftPageResult {
  totalCount: number;
  items: BillingDraftPageItem[];
}

// ==================== API Functions ====================

export async function shipmentTbl(params: ShipmentQueryParams) {
  return request({
    url: '/shipment/tbl',
    method: 'post',
    data: params
  });
}

export async function getShipmentDetail(id: string) {
  return request({
    url: '/shipment/detail',
    method: 'get',
    params: { id }
  });
}

/** GET /shipment/query-consol-transport — JobConsolTransport by shp_pk */
export interface ShipmentConsolTransportDto {
  id?: string;
  jw_pk?: string;
  jw_isvalid?: number;
  jw_transportmode?: string;
  jw_legorder?: number;
  jw_transporttype?: string;
  jw_status?: string;
  jw_vessel?: string;
  jw_voyageflight?: string;
  jw_rl_nkloadport?: string;
  jw_rl_nkdiscport?: string;
  jw_etd?: string | null;
  jw_atd?: string | null;
  jw_eta?: string | null;
  jw_ata?: string | null;
  jw_oa_carrieraddress?: string;
  jw_carrierbookingreference?: string;
  jw_parentguid?: string;
  jk_uniqueconsignref?: string;
}

export interface ShipmentQueryConsolTransportOutput {
  list: ShipmentConsolTransportDto[];
}

export function shipmentQueryConsolTransport(params: { shp_pk: string }) {
  return request<ShipmentQueryConsolTransportOutput>({
    url: '/shipment/query-consol-transport',
    method: 'get',
    params
  });
}

export async function shipmentSave(params: ShipmentSaveParams) {
  return request({
    url: '/shipment/save',
    method: 'post',
    data: params
  });
}

export async function shipmentExport(params: ShipmentQueryParams) {
  return request({
    url: '/shipment/export',
    method: 'post',
    data: params,
    responseType: 'blob'
  });
}

export async function shipmentPdfGenerate(params: ShipmentPdfGenerateParams) {
  return request({
    url: '/shipment/pdf-generate',
    method: 'post',
    data: params
  });
}

export async function shipmentQueryPortCode(params: ShipmentQueryPortCodeParams) {
  return request({
    url: '/shipment/query-port-code',
    method: 'get',
    params
  });
}

export async function shipmentDeactivate(id: number) {
  return request({
    url: '/shipment/deactivate',
    method: 'post',
    data: { id }
  });
}

export async function shipmentReopen(id: number) {
  return request({
    url: '/shipment/reopen',
    method: 'post',
    data: { id }
  });
}

export async function shipmentCopy(id: number) {
  return request<{ id: number; pk: string }>({
    url: '/shipment/copy',
    method: 'post',
    data: { id }
  });
}

export async function shipmentQueryOrgAddress(params: Record<string, any>) {
  return request({
    url: '/shipment/query-org-address',
    method: 'get',
    params
  });
}

export async function shipmentSaveOrgAddress(params: Record<string, any>) {
  return request({
    url: '/shipment/save-org-address',
    method: 'post',
    data: params
  });
}

export async function userQueryAll(params: { query?: string }) {
  return request<{
    list: Array<{ pk: string; full_name: string; email_address: string }>;
  }>({
    url: '/user/query-all',
    method: 'get',
    params
  });
}

export async function chargeCodeOptions() {
  return request<Array<{ code: string; description: string }>>({
    url: '/charge-code/options',
    method: 'get'
  });
}

export async function currencyOptions() {
  return request<Array<{ code: string; desc: string }>>({
    url: '/api/currency/options',
    method: 'get'
  });
}

export async function generateDraft(params: { pks: string[]; chargeType: string }) {
  return request({
    url: '/billing/generate-draft',
    method: 'post',
    data: params
  });
}

export async function deleteBilling(pks: string[]) {
  return request({
    url: '/billing/delete',
    method: 'post',
    data: pks
  });
}

export async function billingDraftPage(params: BillingDraftPageParams) {
  return request<BillingDraftPageResult>({
    url: '/billing/draft-page',
    method: 'post',
    data: params
  });
}

export async function postCharge(params: { ahPks: string[] }) {
  return request({
    url: '/billing/post-charge',
    method: 'post',
    data: params
  });
}

export async function poSearch(params: Record<string, any>) {
  return request({
    url: '/po/search',
    method: 'post',
    data: params
  });
}

export async function poDetailsUploadPoXlsx(formData: FormData) {
  return request({
    url: '/shipment/upload-po-xlsx',
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData
  });
}
