export class mm_customer {
  public ardb_cd:string;
  public brn_cd: string;
  public cust_cd: number;
  public cust_type: string;
  public title: string;
  public first_name: string;
  public middle_name: string;
  public last_name: string;
  public cust_name: string;
  public guardian_name: string;
  public father_name: string;
  public cust_dt: Date;
  public old_cust_cd: string;
  public dt_of_birth: Date;
  public age: number;
  public sex: string;
  public marital_status: string;
  public catg_cd: number;
  public community: number;
  public caste: number;
  public permanent_address: string;
  public ward_no: number;
  public state: string;
  public dist: string;
  public pin: number;
  public vill_cd: string;
  public block_cd: string;
  public service_area_cd: string;
  public occupation: string;
  public phone: string;
  public present_address: string
  public farmer_type: string;
  public email: string;
  public monthly_income: number;
  public date_of_death: Date;
  public sms_flag: string;
  public status: string
  public pan: string;
  public nominee: string;
  public nom_relation: string
  public kyc_photo_type: string;
  public kyc_photo_no: string;
  public kyc_address_type: string;
  public kyc_address_no: string;
  public org_status: string;
  public org_reg_no: number;
  public extra_data: number;
  public created_by: string;
  public created_dt: Date;
  public modified_by: string;
  public modified_dt: Date;
  public acc_num: string;
  public del_flag:string;
  public lbr_status:string;
  public is_weaker:string;
  public aadhar: string;
  public approval_status: string;
  public approved_by: string;
  public approved_dt: Date;
  public pan_status: string;
  public nationality: string;
  public email_id: string;
  public credit_agency: string;
  public credit_score: Number;
  public credit_score_dt: Date;
  public po:Number;
  public ps:Number;
  public kyc_other_type: string;
  public kyc_other_no: string;
  public mis_folio_no: string;
  public sb_folio_no: string;
  public fd_folio_no: string;
  public td_folio_no: string;
  public rd_folio_no: string;
  public merge_flag:string;
  public unique_flag:string;
  public merged_by:string;
  public office_address:string;
  public guardian_relation:string;
  public accholder_name:string;
  public share_folio:string;
  public street:string;

  constructor(){
    this.ardb_cd = localStorage.getItem('__ardb_cd');
  }
}
