import {Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BreakpointObserver} from '@angular/cdk/layout';
import {StepperOrientation} from '@angular/material/stepper';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import { BsModalRef ,BsModalService} from 'ngx-bootstrap/modal';
import { MessageType, mm_acc_type, mm_category, mm_customer, ShowMessage, SystemValues } from '../../Models';
import { p_gen_param } from '../../Models/p_gen_param';
import { InAppMessageService, RestService } from 'src/app/_service';
import { environment } from 'src/environments/environment';
import { LoanSecurityM } from 'src/app/bank-resolver/Models/loan/securityData';
import { td_jewelry } from '../../Models/loan/td_jewelry';
import { LoanJewelryDM } from '../../Models/loan/LoanJewelryDM';
import { Router } from '@angular/router';
import { mm_sector } from '../../Models/loan/mm_sector';
import { mm_activity } from '../../Models/loan/mm_activity';
import { tm_loan_sanction_dtls } from '../../Models/loan/tm_loan_sanction_dtls';
import { LoanOpenDM } from '../../Models/loan/LoanOpenDM';
import { tm_loan_all } from '../../Models/loan/tm_loan_all';
import { tm_guaranter } from '../../Models/loan/tm_guaranter';
import { td_accholder } from '../../Models/deposit/td_accholder';
import { tm_loan_sanction } from '../../Models/loan/tm_loan_sanction';
import { td_loan_sanc_set } from '../../Models/loan/td_loan_sanc_set';
import { CommonServiceService } from '../../common-service.service';
import { mm_instalment_type } from '../../Models/loan/mm_instalment_type';
import { MatStepper } from '@angular/material/stepper';
interface deposit_List {
  ardb_cd: string;
  cust_cd: number;
}
@Component({
  selector: 'app-loan-open-new',
  templateUrl: './loan-open-new.component.html',
  styleUrls: ['./loan-open-new.component.css'],
  
})

export class LoanOpenNewComponent implements OnInit, OnDestroy {
@ViewChild('content2', { static: true }) content2: TemplateRef<any>;
@ViewChild('kycContent', { static: true }) kycContent: TemplateRef<any>;
@ViewChild('netWorth', { static: true }) netWorth: TemplateRef<any>;
@ViewChild('stepper') stepper!: MatStepper;
@ViewChild('nextField') nextField!: ElementRef;
  modalRef: BsModalRef;
  sys = new SystemValues();
  isRetrive:boolean=false
  formattedDate:any;
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true, // disable backdrop click to close the modal
    class: 'modal-sm'
  };
  constructor(private modalService: BsModalService,private msg: InAppMessageService,private comser:CommonServiceService , private router:Router, private svc: RestService,private _formBuilder: FormBuilder, breakpointObserver: BreakpointObserver) {
    this.stepperOrientation = breakpointObserver
      .observe('(min-width: 800px)')
      .pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));
      this.initializeModels();
      this.firstFormGroup = this._formBuilder.group({
        cust_cd: [0, Validators.required],
        cust_name: ['', Validators.required],
        loan_acc_cd:[24043],
        guardian_name:[''],
        lbr:[''],
        age:[0],
        dt_of_birth:[null],
        sex:[''],
        marital_status:[''],
        catg_cd:[0],
        community:[0],
        caste:[0],
        email_id:[''],
        sms_flag:[''],
        phone:[''],
        address:[''],
        pan:[''],
        aadhar:[''],
        l_id:['']
      });
      this.secondFormGroup = this._formBuilder.group({
        loanDetails: this._formBuilder.array([]) // Initialize FormArray
      });
      this.thirdFormGroup = this._formBuilder.group({
        loan_id: ['', Validators.required],
        acc_cd: ['', Validators.required],
        sector_cd:[0],
        activity_cd:[0],
        sanc_amt:[0],
        sanc_no:[1],
        sanc_date:[''],
        validity_dt:['']
      });
  }
  safe_name:any=''
  depositList:any[]=[]
  sanc_validity:any;
  userType:string=localStorage.getItem('userType');
  goldSafeData:any[]=[];
  showNoName=false;
  showNoJoint=false;
  disabledOnNull=true;
  disableLoanId:boolean=true;
  disabledJointOnNull=true;
  suggestedJointCustomer: mm_customer[];
  suggestedCustomerJointHolderIdx: number;
  stepperOrientation: Observable<StepperOrientation>;
  selectedAccType:any=0
  isLoading = false;
  suggestedCustomer: mm_customer[];
  showNoResult=false;
  accountTypeList: mm_acc_type[] = [];
  accountTypeList2: mm_acc_type[] = [];
  categories: mm_category[] = [];
  lbr_status:any;
  p_gen_param = new p_gen_param();
  showMsg: ShowMessage;
  loan_id:any;
  abc:any='';
  sanc_perc:any='';
  hideJoint:boolean=false;
  custKYC:boolean=false;
  securityTypeList:any[]=[];
  securityData:LoanSecurityM;
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  goldSec:boolean=false;
  govCertSec:boolean=false;
  depositSec:boolean=false;
  landSec:boolean=false;
  guaranterSec:boolean=false;
  licSec:boolean=false;
  stockSec:boolean=false;
  allSlabList:any[]=[];
  tdJewelry:td_jewelry[]=[];
  allJewelryType:any[]=[];
  
  goldDM:LoanJewelryDM;
  tot_desc_no:number=0;
  tot_gross_we:number=0;
  tot_alloy_stone_we:number=0;
  tot_net_we:number=0;
  tot_purity_we:number=0;
  tot_act_we:number=0;
  tot_net_value:number=0;
  tot_act_rate:number=0;
  tot_eligibility:number=0;
  tot_sanction:any=0;
  currentSelectedSlab:any;
  noCustSelect:boolean=true;
  imagePreview: string | null = null;
  amountError: string | null = null;
 sectorList: mm_sector[] = [];
  activityList: mm_activity[] = [];
  selectedActivityList: mm_activity[] = [];

    masterModel = new LoanOpenDM();
    tm_loan_all = new tm_loan_all();
    tm_guaranter = new tm_guaranter();
    td_accholder: td_accholder[] = [];
    tm_loan_sanction: tm_loan_sanction[] = [];
    tm_loan_sanction_dtls: tm_loan_sanction_dtls[] = [];
    td_loan_sanc_set_list: td_loan_sanc_set[] = [];
    repaymentFormulaList:any[]=[]
  instalmentTypeList: mm_instalment_type[] = [];
  mindueDate:any;
  intt_on_slab:number;
  slab_range:number;
  safe_id:any;
  sanc_per_grm:number;
  accountTypeListAll:any[]=[];
  reportData:any;
  reportData1:any=[];
  reportData2:any=[];
  depositIntt:any;
  selectedLockDeposit:any[]=[];
  
  // tot_eligibility:number;
  inttRtData:any={};
  isSave:boolean=false;;
  showLien:boolean=false;
  loanIdCreation:boolean=false;
  jewellerySave:boolean=false;
  jewlSecuritySave:boolean=false;
  sanctionChange:boolean=false;
  relationship = [
    { id: 1, val: 'Father' },
    { id: 2, val: 'Mother' },
    { id: 3, val: 'Sister' },
    { id: 4, val: 'Brother' },
    { id: 5, val: 'Friend' },
    { id: 6, val: 'Son' },
    { id: 7, val: 'Daughter' },
    { id: 8, val: 'Others' },
    { id: 9, val: 'Husband' },
    { id: 10,val: 'Wife' },
  ];

  ngOnInit(): void {
    this.jewellerySave=false;
    this.jewlSecuritySave=false
    console.log(this.sys.CurrentDate);
    this.custKYC=false;
    const acc: td_accholder[] = [];
    this.td_accholder = acc;
    this.td_accholder = this.masterModel.tdaccholder;
    for (const i in this.masterModel.tdaccholder) {
      this.setJointHolderRelation(this.td_accholder[i].relation, Number(i));
    }
    this.selectedLockDeposit= [];
   this.selectedAccType=24043;
    // this.addLoanDetail();
    this.intt_on_slab=0;
    this.sanc_per_grm=0;
    this.GetGoldSafe();
    this.getActivityList();
    this.getSectorList();
    this.getRepFormula();
    this.getInstalmentTypeList();
    this.getSecurityTypes();
    this.getAccountTypeList();
    this.getCategoryMaster();
    this.getSlabMaster();
    this.getValuationDesc();
    this.addJointHolder();
    this.getLetestGoldPrice();
    this.modalRef = this.modalService.show(this.content2, this.config);
    this.svc.getlbr(environment.relUrl, null).subscribe(data => {
      console.log(data)
      this.lbr_status = data
    })
  }
  
  get f() { return this.firstFormGroup.controls; }
  get s() { return this.secondFormGroup.controls; }
  get t() { return this.thirdFormGroup.controls; }

  get loanDetails(): FormArray {
    return this.secondFormGroup.get('loanDetails') as FormArray;
  }
  retriveLoanData(){
    this.isRetrive=false;
    this.modalRef = this.modalService.show(this.content2, this.config);
    this.retriveClick();
  }

  createLoanDetail(sl_no: number): FormGroup {
    return this._formBuilder.group({
      loan_id: [this.loan_id , Validators.required],
      acc_cd: [this.selectedAccType, Validators.required],
      sec_type: ['' , Validators.required],
      sl_no: [sl_no],
      acc_type_cd: [0],
      acc_num: [''],
      opn_dt: ['0001-01-01T00:00:00'],
      mat_dt: ['0001-01-01T00:00:00'],
      prn_amt: [0],
      mat_val: [0],
      curr_bal: [0],
      cert_type: [''],
      cert_name: [''],
      cert_no: [''],
      regn_no: [''],
      post_off: [''],
      cert_opn_dt: ['0001-01-01T00:00:00'],
      cert_mat_dt: ['0001-01-01T00:00:00'],
      cert_pdlg_dt: ['0001-01-01T00:00:00'],
      cert_plg_no: [''],
      purchase_value: [0],
      sum_assured: [0],
      pol_type: [''],
      pol_name: [''],
      pol_no: [''],
      pol_opn_dt: ['0001-01-01T00:00:00'],
      pol_mat_dt: ['0001-01-01T00:00:00'],
      pol_sur_val: [0],
      pol_brn_name: [''],
      pol_assgn_no: [''],
      pol_assgn_dt: ['0001-01-01T00:00:00'],
      pol_money_bk: [''],
      pol_sum_assured: [0],
      prop_type: [''],
      prop_addr: [''],
      total_land_area: [''],
      tot_cv_area: [''],
      deed_no: [''],
      distct: [''],
      ps: [''],
      mouza: [''],
      jl_no: [''],
      rs_kha: [''],
      lr_kha: [''],
      rs_dag: [''],
      lr_dag: [''],
      deed_muni: [''],
      ward_no: [''],
      holding_no: [''],
      boundry: [''],
      cnst_yr: [''],
      floor_area: [''],
      mkt_val: [0],
      tax_upto: ['0001-01-01T00:00:00'],
      bl_ro_tax: [''],
      mort_deed_reg_no: [''],
      mort_deed_dt: ['0001-01-01T00:00:00'],
      gold_gross_wt: [0],
      gold_net_wt: [0],
      karat: [0],
      slab_range: [0],
      intt_on_slab: [0],
      safe_id: [0],
      gold_desc: [''],
      gold_qty: [0],
      gold_val: [0],
      stock_type: [''],
      stock_value: [0],
      final_value: [0],
      created_by: [this.sys.UserId],
      modified_by: [this.sys.UserId],
      modified_dt: ['0001-01-01T00:00:00']
    });

   
  }
  createLoanDetailGold(): FormGroup {
    return this._formBuilder.group({
      loan_id: [this.loan_id , Validators.required],
      acc_cd: [this.selectedAccType, Validators.required],
      sec_type: ['G' , Validators.required],
      sl_no: [1],
      acc_type_cd: [0],
      acc_num: [''],
      opn_dt: ['0001-01-01T00:00:00'],
      mat_dt: ['0001-01-01T00:00:00'],
      prn_amt: [0],
      mat_val: [0],
      curr_bal: [0],
      cert_type: [''],
      cert_name: [''],
      cert_no: [''],
      regn_no: [''],
      post_off: [''],
      cert_opn_dt: ['0001-01-01T00:00:00'],
      cert_mat_dt: ['0001-01-01T00:00:00'],
      cert_pdlg_dt: ['0001-01-01T00:00:00'],
      cert_plg_no: [''],
      purchase_value: [0],
      sum_assured: [0],
      pol_type: [''],
      pol_name: [''],
      pol_no: [''],
      pol_opn_dt: ['0001-01-01T00:00:00'],
      pol_mat_dt: ['0001-01-01T00:00:00'],
      pol_sur_val: [0],
      pol_brn_name: [''],
      pol_assgn_no: [''],
      pol_assgn_dt: ['0001-01-01T00:00:00'],
      pol_money_bk: [''],
      pol_sum_assured: [0],
      prop_type: [''],
      prop_addr: [''],
      total_land_area: [''],
      tot_cv_area: [''],
      deed_no: [''],
      distct: [''],
      ps: [''],
      mouza: [''],
      jl_no: [''],
      rs_kha: [''],
      lr_kha: [''],
      rs_dag: [''],
      lr_dag: [''],
      deed_muni: [''],
      ward_no: [''],
      holding_no: [''],
      boundry: [''],
      cnst_yr: [''],
      floor_area: [''],
      mkt_val: [0],
      tax_upto: ['0001-01-01T00:00:00'],
      bl_ro_tax: [''],
      mort_deed_reg_no: [''],
      mort_deed_dt: ['0001-01-01T00:00:00'],
      gold_gross_wt: [this.tot_gross_we?this.tot_gross_we:0],
      gold_net_wt: [this.tot_net_we?this.tot_net_we:0],
      karat: [0],
      slab_range: [0],
      intt_on_slab: [0],
      safe_id: [0],
      gold_desc: [''],
      gold_qty: [this.tot_desc_no?this.tot_desc_no:0],
      gold_val: [this.tot_net_value?this.tot_net_value:0],
      stock_type: [''],
      stock_value: [0],
      final_value: [0],
      created_by: [this.sys.UserId],
      modified_by: [this.sys.UserId],
      modified_dt: ['0001-01-01T00:00:00']
    });

   
  }
  
  recalculateSlNo(): void {
    this.loanDetails.controls.forEach((group, index) => {
      group.get('sl_no')?.setValue(index + 1);
    });
  }
  changeSequrity(secType: string, index: number): void {
    if(secType=='D'){
      this.showLien=true;
    }
    else{
      const currentGroup = this.loanDetails.at(index) as FormGroup;
      // this.getNetWorth(this.f.cust_cd.value);
      // Reset fields except sl_no, loan_id, and sec_type
      currentGroup.patchValue({
        sl_no: currentGroup.get('sl_no')?.value,
        loan_id: this.loan_id,
        sec_type: secType,
        acc_cd:this.selectedAccType
      });
    }
      
    
    
  }
  addLoanDetail() {
    const newSlNo = this.loanDetails.length + 1;
    // if(this.f.loan_acc_cd?.value==24043){
    //   this.loanDetails.push(this.createLoanDetailGold());
    // }
    // else{
    //   this.loanDetails.push(this.createLoanDetail(newSlNo));
    // }
    this.loanDetails.push(this.createLoanDetail(newSlNo));
    // this.loanDetails.push(this.createLoanDetail());
  }

resetDefaultValues(formGroup: FormGroup) {
  Object.keys(formGroup.controls).forEach(controlName => {
    const control = formGroup.get(controlName);
    
    if (control instanceof FormGroup) {
      // Recursively reset values for nested FormGroups
      this.resetDefaultValues(control);
    } else if (control instanceof FormArray) {
      // Loop through FormArray controls and reset each FormGroup inside it
      control.controls.forEach((group: FormGroup) => {
        this.resetDefaultValues(group);
      });
    } else {
      // Check for null or undefined values and reset
      if (control.value === null || control.value === undefined) {
        // Set default value based on field type
        if (this.isDateField(controlName)) {
          control.setValue('0001-01-01T00:00:00'); // default date value
        } else if (this.isNumberField(controlName)) {
          control.setValue(0); // default number value
        }
      }
    }
  });
}
getRepFormula(){
  this.svc.addUpdDel<any>('Loan/GetEmiFormula', null).subscribe(
    emi => {
      this.repaymentFormulaList=emi
      console.log(this.repaymentFormulaList);
     })
}
isDateField(controlName: string): boolean {
  
  const dateFields = [
    'opn_dt', 'mat_dt', 'cert_opn_dt', 'cert_mat_dt', 'cert_pdlg_dt', 
    'tax_upto', 'pol_opn_dt', 'pol_mat_dt', 'pol_assgn_dt', 
    'modified_dt', 'mort_deed_dt'
  ];
  return dateFields.includes(controlName);
}
GetGoldSafe() {
    
  this.isLoading=true
  
  this.svc.addUpdDel('Loan/GetGoldSafeData',null).subscribe(data=>{
    console.log(data);
    debugger
    this.goldSafeData=data
    if(this.reportData.length==0){
      this.comser.SnackBar_Nodata()
    } 
    this.isLoading=false;
  },
  err => {
    this.isLoading=false ;
    this.comser.SnackBar_Nodata()
        })
}

// Helper method to check if the field is a number field
isNumberField(controlName: string): boolean {
  const numberFields = [
    'prn_amt', 'mat_val', 'curr_bal', 'purchase_value', 'sum_assured',
    'pol_sur_val','pol_sum_assured', 'total_land_area', 
   'gold_gross_wt', 'gold_net_wt','gold_val', 'acc_type_cd',
   'mkt_val', 'bl_ro_tax', 'intt_on_slab', 'safe_id','karat',
  'gold_qty', 'stock_value', 'final_value'
  ];
  return numberFields.includes(controlName);
}
  // Remove a FormGroup from the FormArray by index
  removeLoanDetail(index: number) {
    this.loanDetails.removeAt(index);

    // Recalculate sl_no after removal
    this.recalculateSlNo();
  }
  onFileSelected(event: Event,indx): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.imagePreview = reader.result as string; // Set the base64 string to display the preview
      };

      reader.readAsDataURL(file); // Convert file to base64 string
    }
  }
  private getCategoryMaster(): void {
    this.isLoading=true
    this.svc.addUpdDel<mm_category[]>('Mst/GetCategoryMaster', null).subscribe(
      res => {
        console.log(this.categories)
        this.categories = res;
        this.isLoading=false
      },
      err => {this.isLoading=false }
    );
  }
  public getSlabMaster() {
    
    this.isLoading=true
    
    this.svc.addUpdDel('Loan/GetGoldLoanMasterDataLatest',null).subscribe(data=>{
      console.log(data);
     if(data){
      this.allSlabList=data;
      debugger
      this.isLoading=false
      
      
     }
    })
}
getValuationDesc(){
  this.isLoading=true
  this.svc.addUpdDel<any>('Loan/GetGoldItemMasterData', null).subscribe(
    res2 => {
    this.allJewelryType=res2
    this.allJewelryType=this.allJewelryType.sort((a, b) => a.goldItemDes.localeCompare(b.goldItemDes));
    this.isLoading=false
    },
    err => {this.isLoading=false }
  )
debugger
}
getInttSlabMain(data:any){
  this.sanctionChange=true;
  // console.log(this.loanDetails);
  this.currentSelectedSlab=this.allSlabList.filter(e=>e.sanc_perc==data)[0];
  this.slab_range=data;
  this.sanc_perc=data
  this.loanDetails.value[0].intt_on_slab=this.allSlabList.filter(e=>e.sanc_perc==data)[0].inttRate;
  this.intt_on_slab=this.allSlabList.filter(e=>e.sanc_perc==data)[0].inttRate;
  this.loanDetails.value[0].created_by=localStorage.getItem('__userId');
  this.loanDetails.value[0].karat=(+data);
  console.log(this.loanDetails.value);
  if(this.tdJewelry.length>0){
    this.tot_eligibility = Number((this.tot_net_value * (Number(data) / 100)).toFixed(0));
    this.goldFinalValue(Number((this.tot_net_value * (Number(data) / 100)).toFixed(0)));
    debugger
  }

}
getGoldSafeID(data:any){
  console.log(data);
  
  this.loanDetails.value[0].jl_no=data;
  this.safe_id=this.goldSafeData.filter(e=>e.goldSafeId==data)[0].goldSafeName
  console.log(this.loanDetails.value);
  debugger
}
  getInttSlab(data:any,indx){
    console.log(data);
    this.currentSelectedSlab=this.allSlabList.filter(e=>e.slabRange==data)[0]
    this.tdJewelry[indx].intt_on_slab=this.allSlabList.filter(e=>e.slabRange==data)[0].inttRate;
    this.tdJewelry[indx].created_by=localStorage.getItem('__userId');
  }
  slabRangeValidationMain(data:any){
    if(this.currentSelectedSlab){
      const { lowerSlabValue, upperSlabValue } = this.currentSelectedSlab;
      debugger
      if (this.sanc_per_grm < lowerSlabValue || this.sanc_per_grm > upperSlabValue) {
        // this.amountError = `Amount should be between ${lowerSlabValue} and ${upperSlabValue}`;
        this.HandleMessage(true, MessageType.Error, `Amount should be between ${lowerSlabValue} and ${upperSlabValue}`);
        this.loanDetails.value[0].mkt_val='0' ;
        this.sanc_per_grm=0;


      } else {
        this.loanDetails.value[0].mkt_val=data;
        return;
      }
    }
    else{
      this.HandleMessage(true, MessageType.Error, `Please Select a Slab..`);
       
    }
    
  }
  slabRangeValidation(data:any,indx){
    const { lowerSlabValue, upperSlabValue } = this.currentSelectedSlab;
    debugger
    if (this.tdJewelry[indx].act_rate < lowerSlabValue || this.tdJewelry[indx].act_rate > upperSlabValue) {
      // this.amountError = `Amount should be between ${lowerSlabValue} and ${upperSlabValue}`;
      this.HandleMessage(true, MessageType.Error, `Amount should be between ${lowerSlabValue} and ${upperSlabValue}`);
      this.tdJewelry[indx].act_rate='0'      
    } else {
      return;
    }
  }
  getAccountTypeList() {

    if (this.accountTypeList.length > 0) {
      return;
    }
    this.accountTypeList = [];
    this.accountTypeListAll = [];

    this.isLoading = true;
    this.svc.addUpdDel<any>('Mst/GetAccountTypeMaster', null).subscribe(
      res => {

        this.isLoading = false;
        this.accountTypeList = res;
        this.accountTypeListAll = res;
        this.accountTypeList = this.accountTypeList.filter(c => c.dep_loan_flag === 'L');
        this.accountTypeList2 = this.accountTypeList.filter(c => c.dep_loan_flag === 'L');
        this.accountTypeList = this.accountTypeList.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
      },
      err => {
        this.isLoading = false;
      }
    );
  }
  getSecurityTypes(){
    this.securityTypeList = [];

    this.isLoading = true;
    this.svc.addUpdDel<any>('Loan/GetLoanSecurityTypeData', null).subscribe(
      res => {

        this.isLoading = false;
        this.securityTypeList = res;
        // this.securityTypeList = this.securityTypeList.filter(c => c.dep_loan_flag === 'L');
        // this.securityTypeList = this.securityTypeList.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
      },
      err => {
        this.isLoading = false;
      }
    );
  }
  getActivityList() {

    if (this.activityList.length > 0) {
      return;
    }
    this.activityList = [];

    this.svc.addUpdDel<any>('Mst/GetActivityMaster', null).subscribe(
      res => {

        this.activityList = res;
        this.activityList = this.activityList.sort((a, b) => (a.activity_cd > b.activity_cd) ? 1 : -1);
      },
      err => {

      }
    );

  }
  getSectorList() {

    if (this.sectorList.length > 0) {
      return;
    }
    this.sectorList = [];

    this.svc.addUpdDel<any>('Mst/GetSectorMaster', null).subscribe(
      res => {

        this.sectorList = res;
      },
      err => {

      }
    );

  }
  public setLoanAccountType(accType: number): void {
    if(accType==24041){
      this.hideJoint=true
    }else{
      this.hideJoint=false
    }
    if(!this.isRetrive){
      this.getInttRtList(accType);
    }
    this.selectedAccType=accType;
    this.f.loan_acc_cd.setValue(accType);
    
  }
  
   calculateAge(dobString: string): number {
    // Parse the date string into a Date object
    const dob = new Date(dobString);
  
    if (isNaN(dob.getTime())) {
      return 0;
    }
  
    const today = new Date();
  
    // Calculate age
    let age = today.getFullYear() - dob.getFullYear();
  
    // Adjust if the current date is before the birthday this year
    const monthDifference = today.getMonth() - dob.getMonth();
    if (
      monthDifference < 0 || 
      (monthDifference === 0 && today.getDate() < dob.getDate())
    ) {
      age--;
    }
  
    return age;
  }
  
 
  onChangeName(){
    this.suggestedCustomer = null;
    this.showNoResult=false
    if (this.f.cust_name.value.length > 0) {
      this.disabledOnNull=false
    }
    else{
      this.disabledOnNull=true
    }
  }
  public suggestCustomer(): Observable<mm_customer> {
    // this.f.status.disable();
    this.isLoading=true;
    console.log(this.f.cust_name.value)
    // console.log(this.f.cust_name.value.length)
    if (this.f.cust_name.value != null ) {
     
      if (this.f.cust_name.value.length > 0) {
        const prm = new p_gen_param();
        prm.as_cust_name = this.f.cust_name.value.toLowerCase();
        prm.ardb_cd = this.sys.ardbCD;
        this.svc.addUpdDel<any>('Deposit/GetCustDtls', prm).subscribe(
          res => {
            console.log(res)
            this.isLoading=false;
            if (undefined !== res && null !== res && res.length > 0) {
              this.suggestedCustomer = res
              this.showNoResult=false
              return res
            } else {
              this.suggestedCustomer = [];
              this.showNoResult=true;
              return [];
            }
          },
          err => { this.isLoading = false; }
        );
      } else {

        this.suggestedCustomer = null;
        // this.suggestedCustomer.length=0
        // this.suggestedCustomer=[];
        return null;
      }
    }
    return null

  }
  public SelectCustomer(cust: mm_customer): void {
    if(!this.isSave){
      this.UnlocklockLoanID();
    }
  if(cust.dt_of_birth){
    var dob:string;
      dob = ((null !== cust.dt_of_birth && '01/01/0001 00:00' === cust.dt_of_birth.toString()) ? null
    : cust.dt_of_birth.toString());
    }else{
      dob=null;
    }
    this.noCustSelect=false;
    // this.getNetWorth(cust.cust_cd);
    this.suggestedCustomer = null;
   this.firstFormGroup.patchValue({
      cust_cd: cust.cust_cd,
      cust_name: cust.cust_name,
      guardian_name: cust.guardian_name,
      // age:this.calculateAge(dob),
      dt_of_birth: dob?.substring(0,10), 
      sex: cust.sex,
      marital_status: cust.marital_status,
      catg_cd: cust.catg_cd,
      community: cust.community,
      caste: cust.caste,
      phone: cust.phone,
      lbr: cust.lbr_status,
      email_id:cust.email_id,
      sms_flag:cust.sms_flag,
      address:cust.present_address,
      aadhar:cust.aadhar,
      pan:cust.pan
    });
   this.f.lbr.disable();
   this.f.caste.disable();
   this.f.sex.disable();
   this.f.community.disable();
   this.f.catg_cd.disable();
  this.f.sms_flag.disable();
  this.modalRef.hide();
  this.custKYC=true;
  }
  populateLoanNumber(){
    
   if(!this.isRetrive){
    this.p_gen_param.brn_cd = this.sys.BranchCode;
    this.p_gen_param.ardb_cd = this.sys.ardbCD;
    this.p_gen_param.gs_acc_type_cd=this.selectedAccType
    this.isLoading = true;

    this.svc.addUpdDel<any>('Loan/PopulateAccountNumberLoan', this.p_gen_param).subscribe(
      res => {
        // debugger;
        let val = '0';
        this.isLoading = false;
        val = res;
        this.loanIdCreation=true;
        if (val === '' || val == null) {
          this.HandleMessage(true, MessageType.Error, 'Loan Account Number not created !!');
          return;
        }
        else{
          this.loanDetails.clear();
          this.HandleMessage(true, MessageType.Sucess, `Loan Number ${val.toString()} created Successfully`);
          this.loan_id = val.toString();
          this.td_accholder.forEach(holder => {
            this.depositList.push({ ardb_cd: holder.ardb_cd, cust_cd: holder.cust_cd });
          });
          this.depositList.push({ ardb_cd: "1", cust_cd: this.f.cust_cd.value});
          console.log(this.depositList);
          if(this.depositList){
            this.getAllDeposit(this.depositList);
          }
          this.f.l_id.setValue(val);
          this.lockLoanID(this.selectedAccType,val)
          this.tm_loan_all.loan_id=val;
          this.tm_loan_all.acc_cd=this.selectedAccType;
          this.masterModel.tmloanall=this.tm_loan_all;
          if(this.selectedAccType=='24043'){
            this.loanDetails?.push(this.createLoanDetailGold());
            console.log(this.masterModel?.tmloanall);
            // const temp_td = new td_jewelry();
            // temp_td[0].loan_id=val.toString();
            // this.tdJewelry?.push(temp_td);
            console.log(this.loanDetails.value);

          }
          else{
            const newSlNo = 1;
            this.loanDetails.push(this.createLoanDetail(newSlNo));
            console.log(this.loanDetails.value);
            
          }
          
          
        }

      },
      err => {
        this.isLoading = false;
        this.HandleMessage(true, MessageType.Error, 'Loan Account Number not created !!!');

      }

    );
   }
   else{
    
   }
  }
  getColor(cust_cd: number): string {
    const colors = ['#f4cccc', '#c9daf8', '#d9ead3', '#fff2cc', '#d5a6bd', '#a4c2f4'];
    const index = Math.abs(cust_cd) % colors.length; // Assign a color based on index
    return colors[index];
  }
  lockLoanID(acc_cd,acc_num){
    this.isLoading=true;
    const dt={
      "ardb_cd":this.sys.ardbCD,
      "brn_cd":this.sys.BranchCode,
      "acc_cd": acc_cd,
      "as_acc_num":acc_num 
    } 
    this.svc.addUpdDel('Loan/InsertLoanTempData',dt).subscribe(data=>{console.log(data)
      this.isLoading=false
    },
    err => {
       this.isLoading = false; 
      })
  }
  UnlocklockLoanID(){
    this.isLoading=true;
    const dt={
      "as_acc_num":this.loan_id 
    } 
    this.svc.addUpdDel('Loan/DeleteLoanTempData',dt).subscribe(data=>{console.log(data)
      this.isLoading=false
    },
    err => {
       this.isLoading = false; 
      })
  }
  DeleteLoanSecurityData(){
    this.isLoading=true;

    this.svc.addUpdDel(`Loan/DeleteLoanSecurityData?loan_id=${this.loan_id}`,null).subscribe(data=>{console.log(data)
      this.isLoading=false
    },
    err => {
       this.isLoading = false; 
      })
  }
  DeleteGoldMasterDtls(){
    this.isLoading=true;

    this.svc.addUpdDel(`Loan/DeleteGoldMasterDtls?loan_id=${this.loan_id}`,null).subscribe(data=>{console.log(data)
      this.isLoading=false
    },
    err => {
       this.isLoading = false; 
      })
  }
  getLetestGoldPrice(){
    this.isLoading=true;

    this.svc.addUpdDel(`Loan/GetLatestGoldRate`,null).subscribe(data=>{
      console.log(data)
      this.sanc_per_grm=data?data:0;
      this.isLoading=false
    },
    err => {
       this.isLoading = false; 
      })
  }
  addJewelry() {
    if(!this.sanctionChange){
      this.nextField.nativeElement.focus();
      this.HandleMessage(true, MessageType.Error, 'Please Select Loan Sanction Percentage!!!');
    
  }
  else if( !this.isRetrive){
    if (this.tdJewelry !== undefined) {
      const temp_td = new td_jewelry();
      this.tdJewelry.push(temp_td);
      for(let i=0;i<this.tdJewelry.length;i++){
        this.tdJewelry[i].sl_no=i+1;
        this.tdJewelry[i].loan_id=this.loan_id;
        this.tdJewelry[i].slab_range=this.loanDetails.value[0].karat;
        this.tdJewelry[i].act_rate=this.sanc_per_grm.toString();
        this.tdJewelry[i].intt_on_slab=this.intt_on_slab;
        this.tdJewelry[i].goldsafe_id=this.loanDetails.value[0].jl_no;
        this.tdJewelry[i].created_by=this.sys.UserId;
      }
    }
  }
  else{
      if(this.tdJewelry.length>0){
        const temp_td:any={}
        
          temp_td.ardb_cd=this.sys.ardbCD;
          temp_td.brn_cd=this.sys.BranchCode;
          temp_td.sl_no=this.tdJewelry.length+1;
          temp_td.loan_id=this.loan_id;
          temp_td.slab_range=this.tdJewelry[0].slab_range;
          temp_td.act_rate=this.sanc_per_grm.toString();
          temp_td.intt_on_slab=this.intt_on_slab;
          temp_td.goldsafe_id=this.tdJewelry[0].goldsafe_id;
          temp_td.created_by=this.sys.UserId;
        this.tdJewelry.push(temp_td);
      }else{
        const temp_td = new td_jewelry();
      this.tdJewelry.push(temp_td);
      for(let i=0;i<this.tdJewelry.length;i++){
        this.tdJewelry[i].sl_no=i+1;
        this.tdJewelry[i].loan_id=this.loan_id;
        this.tdJewelry[i].slab_range=this.loanDetails.value[0].karat;
        this.tdJewelry[i].act_rate=this.sanc_per_grm.toString();
        this.tdJewelry[i].intt_on_slab=this.intt_on_slab;
        this.tdJewelry[i].goldsafe_id=this.loanDetails.value[0].jl_no;
        this.tdJewelry[i].created_by=this.sys.UserId;
      }
      }
     
        // const temp_td = new td_jewelry;
        // this.tdJewelry.push(temp_td);
        // for(let i=0;i<this.tdJewelry.length;i++){
        //   this.tdJewelry[i].sl_no=i+1;
        //   this.tdJewelry[i].loan_id=this.loan_id;
        //   this.tdJewelry[i].slab_range=this.loanDetails.value[0].slab_range;
        //   this.tdJewelry[i].act_rate=this.sanc_per_grm.toString();
        //   this.tdJewelry[i].intt_on_slab=this.intt_on_slab;
        //   this.tdJewelry[i].goldsafe_id=this.loanDetails.value[0].safe_id;
        //   this.tdJewelry[i].created_by=this.sys.UserId;
        // }
      
    }
  }
  
  // setAllTotal(t1: any, type: number, index: number) {
  //   // Ensure values are numbers and handle empty values
  //   t1.desc_no = Number(t1.desc_no) || 0;
  //   t1.alloy_stone_we = Number(t1.alloy_stone_we) || 0;
  //   t1.gross_we = Number(t1.gross_we) || 0;
  //   t1.net_we = Number(t1.net_we) || 0;
  //   t1.purity_we = Number(t1.purity_we) || 0;
  //   t1.act_we = Number(t1.act_we) || 0;
  //   t1.net_value = Number(t1.net_value) || 0;
  //   if (type === 2) { // If 'net_we' changes
  //     t1.net_we = t1.gross_we;
  //     t1.alloy_stone_we=0 
  //     t1.purity_we = 73;// Set purity to 73%
  //   }
  //   if (type === 3) { // If 'net_we' changes
  //      if(t1.gross_we){
  //       if((+t1.net_we)<0){
  //         t1.alloy_stone_we =0;
  //         t1.net_we =t1.gross_we;
  //         this.HandleMessage(true, MessageType.Warning, 'Please put Valid weight, Net weight fall into 0');
  //       }
  //       else{
  //         t1.net_we = (+t1.gross_we)-(+t1.alloy_stone_we);
  //       }
        
  //     }
  //    else{
  //     this.HandleMessage(true, MessageType.Warning, 'Please put gross weight for this item');
  //    }
  //     t1.purity_we = 73; // Set purity to 73%
  //   }0

  //   // **Set fixed purity percentage (73%) when 'net_we' is updated**
  //   if (type === 4) {
  //      // If 'net_we' changes
  //      if(t1.gross_we){
  //       if(t1.alloy_stone_we<0){
  //         t1.alloy_stone_we =0;
  //         t1.net_we =t1.gross_we;
  //         this.HandleMessage(true, MessageType.Warning, 'Please put Valid weight, Loss weight fall into 0');
  //       }
  //       else{
  //         t1.alloy_stone_we =(+t1.gross_we) -(+t1.net_we)
  //       }
  //       ;
  //     }
  //     else{
  //     this.HandleMessage(true, MessageType.Warning, 'Please put gross weight for this item');

  //     }
  //     t1.purity_we = 73; // Set purity to 73%
  //   }

  //   // **Recalculate 24 Karat Equivalent Gold Weight**
  //   t1.act_we = (t1.net_we * t1.purity_we) / 100;

  //   // **Multiply act_we with sanc_per_grm (global variable)**
  //   t1.net_value = t1.act_we * this.sanc_per_grm;

  //   // **Recalculate Totals**
  //   this.calculateTotals();
  //   console.log(this.slab_range);
    
  // }
  setAllTotal(t1: any, type: number, index: number) {
    // Convert values to numbers, ensuring NaN becomes 0
    t1.desc_no = parseFloat(t1.desc_no) || 0;
    t1.alloy_stone_we = parseFloat(t1.alloy_stone_we) || 0;
    t1.gross_we = parseFloat(t1.gross_we) || 0;
    t1.net_we = parseFloat(t1.net_we) || 0;
    t1.purity_we = parseFloat(t1.purity_we) || 0;
    t1.act_we = parseFloat(t1.act_we) || 0;
    t1.net_value = parseFloat(t1.net_value) || 0;
  
    // Check User Role
    const isAdminUser = this.userType === 'A'; // Example check for admin user
  
    if (type === 2) { 
      t1.net_we = t1.gross_we;
      t1.alloy_stone_we = 0;
      t1.purity_we = isAdminUser ? 73 : 73;
    }
  
    if (type === 3) { 
      if (t1.gross_we) {
        if (t1.net_we < 0) {
          t1.alloy_stone_we = 0;
          t1.net_we = t1.gross_we;
          this.HandleMessage(true, MessageType.Warning, 'Net weight must be ≥ 0');
        } else {
          t1.net_we = t1.gross_we - t1.alloy_stone_we;
        }
      } else {
        this.HandleMessage(true, MessageType.Warning, 'Please enter gross weight first.');
      }
      t1.purity_we = isAdminUser ? 73 : 73;
    }
  
    if (type === 4) { 
      if (t1.gross_we) {
        if (t1.alloy_stone_we < 0) {
          t1.alloy_stone_we = 0;
          t1.net_we = t1.gross_we;
          this.HandleMessage(true, MessageType.Warning, 'Loss weight must be ≥ 0');
        } else {
          t1.alloy_stone_we = t1.gross_we - t1.net_we;
        }
      } else {
        this.HandleMessage(true, MessageType.Warning, 'Please enter gross weight first.');
      }
      t1.purity_we = isAdminUser ? 73 : 73;
    }
  
    // Ensure purity_we is within valid range
    if (!isAdminUser && t1.purity_we > 73) {
      t1.purity_we = 73;
    }
  
    // Fix values up to 1 decimal place
    t1.gross_we = Number(t1.gross_we.toFixed(3));
    t1.alloy_stone_we = Number(t1.alloy_stone_we.toFixed(3));
    t1.net_we = Number(t1.net_we.toFixed(3));
  
    // Calculate 24K equivalent gold weight
    t1.act_we = Number(((t1.net_we * t1.purity_we) / 100).toFixed(3));
  
    // Calculate net value
    t1.net_value = Number((t1.act_we * this.sanc_per_grm).toFixed(3));
  
    // Recalculate totals
    this.calculateTotals();
  }
  calculateTotals() {
    this.tot_desc_no = this.tdJewelry.reduce((sum, item) => sum + (Number(item.desc_no) || 0), 0);
    this.tot_gross_we = this.tdJewelry.reduce((sum, item) => sum + (Number(item.gross_we) || 0), 0);
    this.tot_alloy_stone_we = this.tdJewelry.reduce((sum, item) => sum + (Number(item.alloy_stone_we) || 0), 0);
    this.tot_net_we = this.tdJewelry.reduce((sum, item) => sum + (Number(item.net_we) || 0), 0);
    this.tot_act_we = this.tdJewelry.reduce((sum, item) => sum + (Number(item.act_we) || 0), 0);
    this.tot_net_value = this.tdJewelry.reduce((sum, item) => sum + (Number(item.net_value) || 0), 0);
  
    // Round values to 1 decimal place
    this.tot_gross_we = Number(this.tot_gross_we.toFixed(3));
    this.tot_alloy_stone_we = Number(this.tot_alloy_stone_we.toFixed(3));
    this.tot_net_we = Number(this.tot_net_we.toFixed(3));
    this.tot_act_we = Number(this.tot_act_we.toFixed(3));
    this.tot_net_value = Number(this.tot_net_value.toFixed(3));
    this.tot_eligibility = Number((this.tot_net_value * (Number(this.sanc_perc) / 100)).toFixed(0));
  
    this.goldFinalValue(this.tot_eligibility);
    debugger
  }

  
  removeJewelry(i: number) {
    if (this.tdJewelry.length === 1) {
      this.resetTotals();
      this.tdJewelry.splice(i, 1);
    } else {
      this.tdJewelry.splice(i, 1);
      this.recalculateTotals();
    }
  }
  resetTotals() {
    this.tot_desc_no = 0;
    this.tot_net_we = 0;
    this.tot_gross_we = 0;
    this.tot_alloy_stone_we = 0;
    this.tot_act_we = 0;
    this.tot_net_value = 0;
    this.tot_eligibility = 0;
  }
  recalculateTotals() {
    this.resetTotals();
    this.tdJewelry.forEach((item) => {
      this.tot_desc_no += (+item.desc_no) || 0;
      this.tot_gross_we += (+item.gross_we) || 0;
      this.tot_alloy_stone_we += (+item.alloy_stone_we) || 0;
      this.tot_net_we += (+item.net_we) || 0;
      this.tot_act_we += (+item.act_we) || 0;
      this.tot_net_value += (+item.net_value) || 0;
    });
    this.tot_act_we = +((this.tot_act_we * 100) / 100).toFixed(2);
    this.tot_net_value = +((this.tot_net_value * 100) / 100).toFixed(2);
    this.tot_eligibility = +((this.tot_net_value * (this.slab_range/100)).toFixed(2));
    debugger
    this.goldFinalValue(this.tot_eligibility)
  }

  
  saveGoldSequrity(){
    this.isLoading = true;
    // if(this.tdJewelry.length>0){
    //   this.loanDetails.push(this.createLoanDetailGold());

    
    // }
    this.tdJewelry.forEach(e=>{e.goldsafe_id=this.safe_name;e.slab_range=this.sanc_perc})

    console.log(this.safe_name);
    console.log(this.safe_id);
    console.log(this.tdJewelry);
    
    debugger
    this.svc.addUpdDel<any>('Loan/InsertGoldMasterDtls',this.tdJewelry).subscribe(
      res => {
        // debugger;
        let val = 0;
        this.isLoading = false;
        this.jewellerySave=true;
        val = res;
        if (val == undefined || val == null|| val==-1) {
          this.HandleMessage(true, MessageType.Error, 'Gold items not saved');
          return;
        }
        else{
          this.HandleMessage(true, MessageType.Sucess, `Gold Items Saved Successfully for Loan ID:${this.loan_id}`);
          // this.loan_id = this.loan_id;
          // this.f.l_id.setValue(val)
          this.t.loan_id.setValue(this.loan_id);
          this.t.acc_cd.setValue(this.f.loan_acc_cd.value);
          
        }

      },
      err => {
        this.isLoading = false;
        this.jewellerySave=false;
        this.HandleMessage(true, MessageType.Error, 'Gold items not saved, api issue');

      }

    );
  }
  updateGoldSequrity(){
    this.isLoading = true;
    this.tdJewelry.forEach(e=>{
      e.slab_range=this.sanc_perc;
      e.goldsafe_id=this.safe_name;
    })
    console.log(this.safe_id);
    console.log(this.tdJewelry);
    
    
    debugger
    this.svc.addUpdDel<any>('Loan/UpdateGoldMasterDtls',this.tdJewelry).subscribe(
      res => {
        // debugger;
        let val = 0;
        this.isLoading = false;
        val = res;
        if (val == undefined || val == null|| val==-1) {
          this.HandleMessage(true, MessageType.Error, 'Gold items not saved');
          return;
        }
        else{
          this.HandleMessage(true, MessageType.Sucess, `Gold Items Saved Successfully for Loan ID:${this.loan_id} `);
          // this.loan_id = this.loan_id;
          // this.f.l_id.setValue(val)
          this.t.loan_id.setValue(this.loan_id);
          this.t.acc_cd.setValue(this.f.loan_acc_cd.value);
         this.UpdateSecurity()        
        }

      },
      err => {
        this.isLoading = false;
        this.HandleMessage(true, MessageType.Error, 'Gold items not saved, api issue');

      }

    );
  }
  findHighestInterestRate(array) {
    if(array[0].acc_type_cd==11 && this.selectedAccType==24042){
    return 10;
    }
    
    else{
      const highestRateAccount = array.reduce((prev, current) =>
        prev.intt_rt > current.intt_rt ? prev : current
      );
    
      console.log('Account with the highest interest rate:', highestRateAccount.intt_rt);
      return (highestRateAccount.intt_rt+3);
    }
    
  }
  saveSecurity(){
    
    this.isLoading = true;
    this.tot_eligibility = 0;
    this.loanDetails.value.forEach(e=>{
      if(e.sec_type=='D'){
        this.tot_eligibility += (parseFloat(e.final_value));
        const [day, month, yearAndTime] = this.mindueDate.split('/');
        const [year, time] = yearAndTime.split(' ');
        const formattedDate = new Date(`${year}-${month}-${day}T${time}:00`); // Create ISO string and convert
        console.log('Formatted Date:', formattedDate.toString());
        
        // this.tm_loan_all.instl_start_dt=formattedDate;
        this.tm_loan_all.instl_start_dt=this.getPlus1yearDay();
        this.tm_loan_all.curr_intt_rate=this.depositIntt;
        this.tm_loan_all.instl_no=1;
        this.tm_loan_all.piriodicity='Y';
        this.tm_loan_all.emi_formula_no=2;
        this.sanc_validity=this.getPlus1Month()
      }
      else if(e.sec_type=='G'){
       this.tot_eligibility+= Math.round(parseFloat(e.final_value));
        this.tm_loan_all.instl_start_dt=this.getPlus1yearDay();
        this.tm_loan_all.curr_intt_rate=this.intt_on_slab;
        this.tm_loan_all.instl_no=1;
        this.tm_loan_all.piriodicity='Y';
        this.tm_loan_all.emi_formula_no=2;
        this.sanc_validity=this.getPlus1Month()

      }
      else if(e.acc_cd==24041||e.acc_cd==24045){
        this.getInttRtList(e.acc_cd);
        this.tot_eligibility += Math.round(parseFloat(e.final_value));
        this.tm_loan_all.instl_no=1;
        this.tm_loan_all.emi_formula_no=1;
        this.sanc_validity=this.getPlus1Month()

        
      }
      else{
        this.sanc_validity=this.getPlus1Month()
        this.tot_eligibility += Math.round(parseFloat(e.final_value));
      }
      
    })



    
    // this.tot_eligibility =0;
    // const totalFinalValue = this.loanDetails.value.reduce((total, item) => {
    //   return total + parseFloat(item.final_value); 
    // }, 0);
    // this.tot_eligibility=totalFinalValue;
    console.log(this.tot_eligibility);
    if(this.userType=='A'){
      this.thirdFormGroup.controls['sanc_amt'].enable();
    }else{
      this.thirdFormGroup.controls['sanc_amt'].disable();
    }
    
    this.thirdFormGroup.patchValue({
      // sanc_amt:Math.round(parseFloat(this.loanDetails.value[0]?.final_value)),
      sanc_amt:Math.round(this.tot_eligibility),
      loan_id:this.loan_id,
      acc_cd:this.loanDetails.value[0]?.acc_cd,
      sanc_date:this.sys.CurrentDate,
      validity_dt:this.getPlus1Month(),
    });
    this.accountTypeList2=this.accountTypeList2.filter(e=>e.acc_type_cd==this.selectedAccType)
    console.log(this.thirdFormGroup.controls);
    console.log(this.accountTypeList2);
    debugger
    
    this.masterModel.tmloanall=this.tm_loan_all;
    this.masterModel.tmlaonsanctiondtls=this.tm_loan_sanction_dtls;
   
    console.log(this.masterModel);
    let goldDesc=''
    this.tdJewelry.forEach(e=>{
      goldDesc+=(e.desc_val+',')
    })
    console.log(goldDesc);
    
    const currentGroup = this.loanDetails.at(0) as FormGroup;
      currentGroup.patchValue({
        gold_gross_wt:this.tot_gross_we,
        gold_net_wt: this.tot_net_we,
        karat: this.loanDetails.value[0].sec_type=='G'?this.sanc_perc:0,
        jl_no: this.safe_name,
        gold_desc:goldDesc,
        gold_qty:this.tot_desc_no,
        gold_val:this.tot_net_value
      });
    // this.loanDetails.controls.forEach((group: FormGroup) => {
    //   this.resetDefaultValues(group);
    // });
    console.log(this.loanDetails.value)
     console.log(this.loan_id);
    this.t.sector_cd.setValue('O');
    this.t.activity_cd.setValue('99');



   
    
this.svc.addUpdDel<any>('Loan/InsertLoanSecurityDataList',this.loanDetails.value).subscribe(
  res => {
    let val = '0';
    this.isLoading = false;
    this.jewlSecuritySave=true;
    val = res;
    if (val === '' || val == null) {
      this.HandleMessage(true, MessageType.Error, 'Loan Security not saved');
      return;
    }
    else{
      this.HandleMessage(true, MessageType.Sucess, `Loan Security Saved Successfully for Loan ID:${this.loan_id} `);
       if(this.loanDetails.value[0].sec_type == 'D'){
      this.loanDetails.value.forEach(e=>{
        this.lienDepAC(e.acc_type_cd,e.acc_num)
      })}
    }

  },
  err => {
    this.jewlSecuritySave=false
    this.isLoading = false;
    this.HandleMessage(true, MessageType.Error, 'Loan Security not saved, api issue');

  }

);

}
UpdateSecurity(){
    
  this.isLoading = true;
  this.tot_eligibility = 0;
  this.loanDetails.value.forEach(e=>{
    if(e.sec_type=='D'){
      this.tot_eligibility += Math.round(parseFloat(e.final_value));
      // const [day, month, yearAndTime] = this.mindueDate.split('/');
      // const [year, time] = yearAndTime.split(' ');
      // const formattedDate = new Date(`${year}-${month}-${day}T${time}:00`); // Create ISO string and convert
      // console.log('Formatted Date:', formattedDate.toString());
      
      // this.tm_loan_all.instl_start_dt=formattedDate;
      this.tm_loan_all.instl_start_dt=this.getPlus1yearDay();
      this.tm_loan_all.curr_intt_rate=this.depositIntt;
      this.tm_loan_all.instl_no=1;
      this.tm_loan_all.piriodicity='Y';
      this.tm_loan_all.emi_formula_no=2;
      this.sanc_validity=this.getPlus1Month()
    }
    else if(e.sec_type=='G'){
     this.tot_eligibility+= Math.round(parseFloat(e.final_value));
      this.tm_loan_all.instl_start_dt=this.getPlus1yearDay();
      this.tm_loan_all.curr_intt_rate=this.intt_on_slab;
      this.tm_loan_all.instl_no=1;
      this.tm_loan_all.piriodicity='Y';
      this.tm_loan_all.emi_formula_no=2;
      this.sanc_validity=this.getPlus1Month()

    }
    else if(e.acc_cd==24041||e.acc_cd==24045){
      this.getInttRtList(e.acc_cd);
      this.tot_eligibility += Math.round(parseFloat(e.final_value));
      this.tm_loan_all.instl_no=1;
      this.tm_loan_all.emi_formula_no=1;
      this.sanc_validity=this.getPlus1Month()

      
    }
    else{
      this.sanc_validity=this.getPlus1Month()
      this.tot_eligibility += Math.round(parseFloat(e.final_value));
    }
    if(!this.isSave){
      // this.unlienDepAC(e.acc_type_cd,e.acc_num);
      this.DeleteLoanSecurityData();
    }
    else{

    }
  })



  
  // this.tot_eligibility =0;
  // const totalFinalValue = this.loanDetails.value.reduce((total, item) => {
  //   return total + parseFloat(item.final_value); 
  // }, 0);
  // this.tot_eligibility=totalFinalValue;
  console.log(this.tot_eligibility);
  if(this.userType=='A'){
    this.thirdFormGroup.controls['sanc_amt'].enable();
  }else{
    this.thirdFormGroup.controls['sanc_amt'].disable();
  }
  this.thirdFormGroup.patchValue({
    sanc_amt:(Math.round(this.tot_eligibility)),
    loan_id:this.loan_id,
    acc_cd:this.loanDetails.value[0]?.acc_cd,
    sanc_date:this.sys.CurrentDate,
    validity_dt:this.getPlus1Month(),
  });
  this.accountTypeList2=this.accountTypeList2.filter(e=>e.acc_type_cd==this.selectedAccType)
  console.log(this.thirdFormGroup.controls);
  console.log(this.accountTypeList2);
  debugger
  
  this.masterModel.tmloanall=this.tm_loan_all;
  this.masterModel.tmlaonsanctiondtls=this.tm_loan_sanction_dtls;
 
  console.log(this.masterModel);
  let goldDesc=''
  this.tdJewelry.forEach(e=>{
    goldDesc+=(e.desc_val+',')
  })
  console.log(goldDesc);
  
  const currentGroup = this.loanDetails.at(0) as FormGroup;
    currentGroup.patchValue({
      gold_gross_wt:this.tot_gross_we,
      gold_net_wt: this.tot_net_we,
      karat: this.loanDetails.value[0]?.sec_type=='G'?this.sanc_perc:0,
      jl_no: this.safe_name,
      gold_desc:goldDesc,
      gold_qty:this.tot_desc_no,
      gold_val:this.tot_net_value
    });
  // this.loanDetails.controls.forEach((group: FormGroup) => {
  //   this.resetDefaultValues(group);
  // });
  console.log(this.loanDetails.value)
   console.log(this.loan_id);
  this.t.sector_cd.setValue('O');
  this.t.activity_cd.setValue('99');



 
  
this.svc.addUpdDel<any>('Loan/UpdateLoanSecurityDataList',this.loanDetails.value).subscribe(
res => {
  let val = '0';
  this.isLoading = false;
  val = res;
  if (val === '' || val == null) {
    this.HandleMessage(true, MessageType.Error, 'Loan Security not saved');
    return;
  }
  else{
    this.HandleMessage(true, MessageType.Sucess, `Loan Security Saved Successfully for Loan ID:${this.loan_id} `);
     if(this.loanDetails.value[0].sec_type == 'D'){
    this.loanDetails.value.forEach(e=>{
      this.lienDepAC(e.acc_type_cd,e.acc_num)
    })}
  }

},
err => {
  
  this.isLoading = false;
  this.HandleMessage(true, MessageType.Error, 'Loan Security not saved, api issue');

}

);

}
sancAmtChange(i:any){
  console.log(i);
  console.log(this.masterModel);
  this.tot_eligibility=(Math.round(+i))
  this.masterModel.tmlaonsanctiondtls[0].sanc_amt=(Math.round(+i))
  this.thirdFormGroup.controls.sanc_amt.setValue(Math.round(+i))
  debugger
}
getPlus1yearDay() {
  const today = new Date(this.sys.CurrentDate); 
  // const today = new Date();
  today.setFullYear(today.getFullYear() + 1); // Add 1 year directly
  return today;
}
getPlus1Month() {
  const today = new Date(this.sys.CurrentDate); 
  // const today = new Date();
  today.setMonth(today.getMonth() + 1); // Add 1 month
  debugger
  return today;
  
}
  resetFastFrm(){
    this.firstFormGroup.reset();
    this.intt_on_slab=0;
    this.sanc_per_grm=0;
    this.showLien=true;
    this.tm_loan_all= new tm_loan_all();
    this.td_accholder=[]
    const temp_td_accholder = new td_accholder();
    this.td_accholder.push(temp_td_accholder);
    this.tdJewelry=[];
    this.UnlocklockLoanID();

    
  }
  resetFullForm(){
    if(this.loanDetails.value[0]?.sec_type == 'D'){
      this.loanDetails.value.forEach(e=>{
        this.unlienDepAC(e.acc_type_cd,e.acc_num);
      })
    }
    this.loanDetails.clear();
    this.selectedLockDeposit=[];
    this.addLoanDetail();
    this.tot_eligibility =0;
    this.tdJewelry=[];
    const temp_td = new td_jewelry();
      this.tdJewelry.push(temp_td);
}
  clearData(){
    this.intt_on_slab=0;
    this.sanc_per_grm=0;
    this.showLien=true;
    this.secondFormGroup.reset();
    this.thirdFormGroup.reset();
    this.selectedAccType=24043;
    this.tm_loan_all= new tm_loan_all();
    this.td_accholder=[]
    const temp_td_accholder = new td_accholder();
    this.td_accholder.push(temp_td_accholder);
    this.tdJewelry=[];
    this.UnlocklockLoanID();
    

  }
  updateLoanData(){
    this.router.navigate([this.sys.BankName + '/la']);

  }
  backScreen() {
    console.log(this.loanDetails.value);
    if(!this.isRetrive && !this.isSave){
      if(this.loanDetails.value[0]?.sec_type == 'G'){
        this.DeleteGoldMasterDtls();
        this.DeleteLoanSecurityData();
        this.UnlocklockLoanID();
      this.router.navigate([this.sys.BankName + '/la']);
        debugger
      }
      else if(this.loanDetails.value[0]?.sec_type == 'D'){
        this.UnlocklockLoanID();
        this.DeleteLoanSecurityData();
        this.loanDetails.value.forEach(e=>{
          this.unlienDepAC(e.acc_type_cd,e.acc_num);
        })
        setTimeout(() => {
          this.router.navigate([this.sys.BankName + '/la']);
        }, 1500);
        
      }
      // else{
      //   this.DeleteLoanSecurityData();
      //   this.UnlocklockLoanID();
      // this.router.navigate([this.sys.BankName + '/la']);
      // debugger
      // }
    
    }
    else if(this.isRetrive){
      if(this.loanDetails.value[0]?.sec_type == 'G'){
        this.UnlocklockLoanID();
      this.router.navigate([this.sys.BankName + '/la']);
        debugger
      }
      else if(this.loanDetails.value[0]?.sec_type == 'D'){
        this.UnlocklockLoanID();
      
          this.router.navigate([this.sys.BankName + '/la']);
      
        
      }
      // else{
      //   this.DeleteLoanSecurityData();
      //   this.UnlocklockLoanID();
      // this.router.navigate([this.sys.BankName + '/la']);
      // debugger
      // }
    
    }
    else{
      this.UnlocklockLoanID();
      this.router.navigate([this.sys.BankName + '/la']);
      this.selectedAccType=0;
      this.intt_on_slab=0;
      this.sanc_per_grm=0;
      this.tm_loan_all= new tm_loan_all();
      this.td_accholder=[];
      const temp_td_accholder = new td_accholder();
      this.td_accholder.push(temp_td_accholder);
      this.tdJewelry=[];
      this.loan_id=''
      
    }
    


  }

 public setSectorType(sec: string): void {
    debugger
    const loan_sanction_data=new tm_loan_sanction_dtls();
    // this.tm_loan_sanction_dtls[0].sector_cd = sec;
    loan_sanction_data.sanc_amt=this.tot_net_value;
    loan_sanction_data.sector_cd=sec;
    loan_sanction_data.ardb_cd=this.sys.ardbCD;
    loan_sanction_data.sector_desc=this.sectorList.filter(x => x.sector_cd.toString() === sec.toString())[0].sector_desc;
    this.tm_loan_sanction_dtls.push(loan_sanction_data);
    // this.tm_loan_sanction_dtls[0].sector_desc = this.sectorList.filter(x => x.sector_cd.toString() === sec.toString())[0].sector_desc;
   
    // this.tm_loan_sanction_dtls[0].activity_cd = null;
    // this.tm_loan_sanction_dtls[0].activity_desc = null;
    // this.tm_loan_sanction_dtls[0].crop_cd = null;
    // this.tm_loan_sanction_dtls[0].crop_desc = null;
    // this.tm_loan_sanction_dtls.due_dt = null;
    // this.tm_loan_sanction_dtls.sanc_amt = null;

    this.selectedActivityList = [];
    // this.selectedCorpList = [];
    this.selectedActivityList = this.activityList.filter(x => x.sector_cd.toString() === sec.toString());
    


  }

  public setActivityType(act: string): void {
    // this.safe_id=act;
    if(this.tm_loan_sanction_dtls){
      this.tm_loan_sanction_dtls[0].activity_cd = act;
      this.tm_loan_sanction_dtls[0].activity_desc =
        this.activityList.filter(x => x.activity_cd.toString() === 
          act.toString())[0].activity_desc;
      debugger
      this.tm_loan_sanction_dtls[0].crop_cd = null;
      this.tm_loan_sanction_dtls[0].crop_desc = null;
    }
    
  }
  private HandleMessage(show: boolean, type: MessageType = null, message: string = null) {
    this.showMsg = new ShowMessage();
    this.showMsg.Show = show;
    this.showMsg.Type = type;
    this.showMsg.Message = message;
  }
  
  public closeAlertMsg() {

    this.HandleMessage(false);
    // this.disableAll = 'N';
  }
  createLoan(data,indx): FormGroup {
    return this._formBuilder.group({
      loan_id: [this.loan_id , Validators.required],
      acc_cd: [this.selectedAccType, Validators.required],
      sec_type: ['D' , Validators.required],
      sl_no: [indx+1],
      acc_type_cd: [data.acc_type_cd],
      acc_num: [data.acc_num],
      opn_dt: [data.opening_dt],
      mat_dt: [data.mat_dt],
      prn_amt: [data.balance],
      mat_val: [data.total],
      curr_bal: [data.balance],
      cert_type: [''],
      cert_name: [''],
      cert_no: [''],
      regn_no: [''],
      post_off: [''],
      cert_opn_dt: ['0001-01-01T00:00:00'],
      cert_mat_dt: ['0001-01-01T00:00:00'],
      cert_pdlg_dt: ['0001-01-01T00:00:00'],
      cert_plg_no: [''],
      purchase_value: [0],
      sum_assured: [0],
      pol_type: [''],
      pol_name: [''],
      pol_no: [''],
      pol_opn_dt: ['0001-01-01T00:00:00'],
      pol_mat_dt: ['0001-01-01T00:00:00'],
      pol_sur_val: [0],
      pol_brn_name: [''],
      pol_assgn_no: [''],
      pol_assgn_dt: ['0001-01-01T00:00:00'],
      pol_money_bk: [''],
      pol_sum_assured: [0],
      prop_type: [''],
      prop_addr: [''],
      total_land_area: [''],
      tot_cv_area: [''],
      deed_no: [''],
      distct: [''],
      ps: [''],
      mouza: [''],
      jl_no: [''],
      rs_kha: [''],
      lr_kha: [''],
      rs_dag: [''],
      lr_dag: [''],
      deed_muni: [''],
      ward_no: [''],
      holding_no: [''],
      boundry: [''],
      cnst_yr: [''],
      floor_area: [''],
      mkt_val: [0],
      tax_upto: ['0001-01-01T00:00:00'],
      bl_ro_tax: [''],
      mort_deed_reg_no: [''],
      mort_deed_dt: ['0001-01-01T00:00:00'],
      gold_gross_wt: [0],
      gold_net_wt: [0],
      karat: [0],
      slab_range: [''],
      intt_on_slab: [0],
      safe_id: [0],
      gold_desc: [''],
      gold_qty: [0],
      gold_val: [0],
      stock_type: [''],
      stock_value: [0],
      final_value: [((+data.total)*0.8).toFixed(0)],
      created_by: [''],
      modified_by: [''],
      modified_dt: ['0001-01-01T00:00:00']
    });

   
  }
  onChange(row: any, event: any, index:number): void {
    if (event.target.checked) {
      // Add the row to selectedLockDeposit
      if (!this.selectedLockDeposit.includes(row)) {
        row.lock_mode="L";
        this.selectedLockDeposit.push(row);
      }
    } else {
      // Remove the row from selectedLockDeposit
      this.selectedLockDeposit = this.selectedLockDeposit.filter(
        (item) => item !== row
      );
    }
    if(this.selectedAccType==24041){

      this.depositIntt=this.tm_loan_all.curr_intt_rate;
      this.mindueDate=this.findMinimumMaturityDate(this.selectedLockDeposit)
    }else{
      this.depositIntt=this.findHighestInterestRate(this.selectedLockDeposit)
      this.mindueDate=this.findMinimumMaturityDate(this.selectedLockDeposit)
    }
    console.log(this.selectedLockDeposit);
    console.log(this.reportData1);
    console.log(this.loanDetails.value);
  }
  findMinimumMaturityDate(array) {
    const minMatDt = array.reduce((minDate, current) => {
      const currentMatDt = new Date(current.mat_dt);
      return currentMatDt < new Date(minDate) ? current.mat_dt : minDate;
    }, array[0].mat_dt);
    return minMatDt

    // const earliestMaturityAccount = array.reduce((prev, current) =>
    //   new Date(prev.mat_dt) < new Date(current.mat_dt) ? prev : current
    // );
  
    // console.log('Account with the earliest maturity date:', earliestMaturityAccount.mat_dt);
    // return earliestMaturityAccount.mat_dt;
  }
  setTosecurity(ind:any){
    console.log(ind);
    this.showLien=false;

    if(this.isRetrive){
      this.selectedLockDeposit.forEach((i, index) =>{
        debugger
         
            const currentGroup = this.loanDetails.at(ind) as FormGroup;
          currentGroup.patchValue({
            sl_no:  index+1,
            loan_id: this.loan_id,
            sec_type: 'D',
            acc_cd:this.selectedAccType,
            acc_num:i.acc_num,
            acc_type_cd:i.acc_type_cd,
            opn_dt:i.opening_dt,
            mat_dt:i.mat_dt,
            curr_bal:i.balance,
            final_value:(((+i.total)*.8).toFixed(0)),
            mat_val:i.total,
            prn_amt:i.balance,
    
          });
          debugger;  
        })
      console.log(this.loanDetails.value)
    }
    else{
      this.selectedLockDeposit.forEach((i, index) =>{
        debugger
          if(index==0 ){
            const currentGroup = this.loanDetails.at(0) as FormGroup;
          currentGroup.patchValue({
            sl_no:  index+1,
            loan_id: this.loan_id,
            sec_type: 'D',
            acc_cd:this.selectedAccType,
            acc_num:i.acc_num,
            acc_type_cd:i.acc_type_cd,
            opn_dt:i.opening_dt,
            mat_dt:i.mat_dt,
            curr_bal:i.balance,
            final_value:(((+i.total)*.8).toFixed(0)),
            mat_val:i.total,
            prn_amt:i.balance,
    
          });
          debugger;
          }
          else{
            debugger
            this.loanDetails.push(this.createLoan(i,index))
          }
          
        })
      console.log(this.loanDetails.value)
    }
    
  }
  formatDateForInput(dateString: string): string {
    // Split the input date and extract MM/DD/YYYY
    const [datePart] = dateString.split(" ");
    const [month, day, year] = datePart.split("/");
  
    // Return the date in YYYY-MM-DD format
    return `${year}-${month}-${day}`;
  }
  openNetWorth(netWorth: TemplateRef<any>) {
    this.getNetWorth(this.f.cust_cd.value);
    this.modalRef = this.modalService.show(netWorth, { class: 'modal-xl' });


  }
  public getNetWorth(customer_code) {
   
       
      var dt={
        "ardb_cd":this.sys.ardbCD,
        // "brn_cd":this.sys.BranchCode,
        "cust_cd":customer_code
      }
     
      this.isLoading=true
      this.svc.addUpdDel('UCIC/GetLoanDtls',dt).subscribe(data=>{console.log(data)
        this.reportData=data
        for(let i=0;i<this.reportData.length;i++){
          this.reportData[i].acc_desc= this.accountTypeListAll.filter(c => c.acc_type_cd == this.reportData[i]?.acc_cd)[0]?.acc_type_desc;
        }
        this.svc.addUpdDel('UCIC/GetDepositDtls',dt).subscribe(data=>{console.log(data)
          this.reportData2=data;
          for(let i=0;i<this.reportData2.length;i++){
            this.reportData2[i].acc_type_desc= this.accountTypeListAll.filter(c => c.acc_type_cd == this.reportData1[i]?.acc_type_cd)[0]?.acc_type_desc;
          }
         
          this.isLoading=false
          console.log(this.reportData,this.reportData1,)
         
        },
        err => {
           this.isLoading = false;
           this.comser.SnackBar_Error(); 
          })
      },
      err => {
         this.isLoading = false;
         this.comser.SnackBar_Error(); 
        })
      
    
   
  }
  public getAllDeposit(list) {
   
      
   
   
    this.isLoading=true
    
      this.svc.addUpdDel('Deposit/GetCustomerDepositsAll',list).subscribe(data=>{console.log(data)
        this.reportData1=data;
        for(let i=0;i<this.reportData1.length;i++){
          this.reportData1[i].acc_type_desc= this.accountTypeListAll.filter(c => c.acc_type_cd == this.reportData1[i]?.acc_type_cd)[0]?.acc_type_desc;
        }
        
        this.isLoading=false
        console.log(this.reportData,this.reportData1,)
       
      },
      err => {
         this.isLoading = false;
         this.comser.SnackBar_Error(); 
        })
    
    
  
 
}
    noJointOnNull(idx: number){
      this.suggestedJointCustomer=null
      this.showNoJoint=false;
      if (this.td_accholder[idx].acc_holder.length > 2) 
        this.disabledJointOnNull=false;
     else
        this.disabledJointOnNull=true;
  }
    public suggestJointCustomer(idx: number): void {
      this.isLoading=true;
      this.suggestedCustomerJointHolderIdx = idx;
      debugger
      if (this.td_accholder[idx].acc_holder.length > 2) {
        const prm = new p_gen_param();
        // prm.ad_acc_type_cd = +this.f.acc_type_cd.value;
        prm.as_cust_name = this.td_accholder[idx].acc_holder.toLowerCase();
        this.svc.addUpdDel<any>('Deposit/GetCustDtls', prm).subscribe(
          res => {
            this.isLoading=false;
            if (undefined !== res && null !== res && res.length > 0) {
              this.suggestedJointCustomer = res;
              this.showNoJoint=false;
            } else {
              this.showNoJoint=true;
  
              this.suggestedJointCustomer = [];
            }
          },
          err => {
            this.showNoJoint=true;
  
             this.isLoading = false; }
        );
      } else {
        this.showNoJoint=true;
  
        this.suggestedJointCustomer = null;
      }
  
    }
  
    public setJointCustDtls(cust_cd: number, idx: number): void {
  
      this.td_accholder[idx].cust_cd = cust_cd;
      this.populateJointCustDtls(cust_cd, idx);
      this.suggestedJointCustomer = null;
    }
  
    populateJointCustDtls(cust_cd: number, idx: number) {
      console.log(cust_cd)
      console.log(this.suggestedJointCustomer)
      
      debugger;
      let temp_mm_cust = new mm_customer();
      temp_mm_cust = this.suggestedJointCustomer.filter(c => c.cust_cd.toString() === cust_cd.toString())[0];
      console.log(temp_mm_cust);
      debugger;
      this.td_accholder[idx].acc_holder = temp_mm_cust.cust_name;
    }
    public setInstalPeriod(instlType: string): void {

      this.tm_loan_all.piriodicity = instlType;
      this.tm_loan_all.instalmentTypeDesc = this.instalmentTypeList.filter(x => x.desc_type.toString() === instlType)[0].ins_desc;
    }
  
    setJointHolderRelation(relation: string, idx: number) {
  
      this.td_accholder[idx].relation = relation;
      // this.td_accholder[idx].relationId =
      //   this.relationship.filter(x => x.val.toString() === relation)[0].id;
    }
    getInttRtList(accCD) {

      
      this.inttRtData = null;
  
      this.svc.addUpdDel<any>(`Loan/GetLoanSchemeRate?acc_cd=${accCD}`, null).subscribe(
        res => {
          console.log(res)
          this.inttRtData = res;
          if(this.inttRtData){
            debugger
            this.tm_loan_all.instl_start_dt=this.getPlus1yearDay();
            this.tm_loan_all.curr_intt_rate=this.inttRtData.intt_rt;
            this.tm_loan_all.instl_no=1;
            this.tm_loan_all.piriodicity=this.inttRtData.intt_calc_type;
            this.tm_loan_all.emi_formula_no=(accCD==24045?1:2);
          }
        },
        err => {
  
        }
      );
    }
    getInstalmentTypeList() {

      if (this.instalmentTypeList.length > 0) {
        return;
      }
      this.instalmentTypeList = [];
  
      this.svc.addUpdDel<any>('Mst/GetInstalmentTypeMaster', null).subscribe(
        res => {
  
          this.instalmentTypeList = res;
        },
        err => {
  
        }
      );
    }
    rep_stDT(){
      const cDt = this.sys.CurrentDate.getTime();
      console.log(this.tm_loan_all.instl_start_dt)
      // const opDt = Utils.convertStringToDt(this.tm_loan_all.instl_start_dt.toString()).getTime();
      const opDt = this.tm_loan_all.instl_start_dt.getTime();
          // const o = Utils.convertStringToDt(this.td.opening_dt.value);
          const diffDays =(opDt-cDt ) / (1000 * 3600 * 24);
          const diff = diffDays
          console.log(cDt + " " + opDt + " " + diffDays)
          debugger
          if(diff<=0){
            this.HandleMessage(true, MessageType.Warning, 'Installment start date should be getter than Operation Date!!' );
              this.tm_loan_all.instl_start_dt=null
             debugger
          }
      
    }
    public setRepaymentFormula(formula: number): void {

      this.tm_loan_all.emi_formula_no = Number(formula);
      this.tm_loan_all.emiFormulaDesc = this.repaymentFormulaList.filter(x => x.formula_no == formula)[0].formula_desc;
    }
    addJointHolder() {
      if (this.masterModel.tdaccholder !== undefined) {
        const temp_td_accholder = new td_accholder();
        this.masterModel.tdaccholder.push(temp_td_accholder);
      }
    }
  
    removeJointHolder() {
      if (this.masterModel.tdaccholder !== undefined && this.masterModel.tdaccholder.length > 1) {
        this.masterModel.tdaccholder.pop();
      }
    }
    previewData(){
      console.log(this.loanDetails.value);
      console.log(this.secondFormGroup.value);
      console.log(this.thirdFormGroup.value);
      if(!this.td_accholder){
        this.addJointHolder()
      }
      this.masterModel.tmlaonsanctiondtls.push(new tm_loan_sanction_dtls());
      this.masterModel.tmlaonsanction.push(new tm_loan_sanction());
      this.masterModel.tmlaonsanctiondtls.forEach(i => {
      i.activity_cd=this.t.activity_cd.value,
      i.approval_status ="A",
      i.due_dt=this.getPlus1Month(),
      i.loan_id=this.t.loan_id.value,
      i.sanc_no=this.t.sanc_no.value,
      // i.sanc_amt=this.thirdFormGroup.controls.sanc_amt.value,
      i.sanc_amt=Number(Number(this.tot_eligibility).toFixed(0)),
      i.sector_cd=this.t.sector_cd.value,
      i.sanc_status="C",
      i.srl_no=1
      
    });
    this.masterModel.tmlaonsanction.forEach(i => {
      i.created_by=this.sys.UserId,
      i.approval_status ="A",
      i.approved_by =this.sys.UserId,
      i.approved_dt = this.sys.CurrentDate,
      i.sanc_dt=this.t.sanc_date.value,
      i.loan_id=this.t.loan_id.value,
      i.sanc_no=this.t.sanc_no.value,
      i.ardb_cd=this.sys.ardbCD
      
    });
    debugger
      this.masterModel.tdaccholder.forEach(e=>{
          e.acc_num=this.loan_id,
          e.brn_cd=this.sys.BranchCode,
          e.ardb_cd=this.sys.ardbCD,
          e.acc_type_cd=this.selectedAccType
          // e.acc_holder=this.selectedAccType,
        })

      console.log(this.masterModel);
      console.log(this.loanDetails.value);
      console.log(this.tm_loan_sanction_dtls);
      console.log(this.tm_loan_sanction);
      debugger
      
    }
    FinalSaveLoan(){
      console.log(this.masterModel);
      if(this.isRetrive){
        this.masterModel.tmloanall.curr_intt_rate=this.intt_on_slab;
      }
      debugger;
      this.masterModel.tmloanall.approval_status = 'A';
      this.masterModel.tmloanall.approved_by = this.sys.UserId;
      this.masterModel.tmloanall.approved_dt = this.sys.CurrentDate;
      this.masterModel.tmloanall.party_cd = this.f.cust_cd.value;
      this.masterModel.tmloanall.brn_cd = this.sys.BranchCode;
      this.masterModel.tmloanall.created_by = this.sys.UserId;
      this.masterModel.tmloanall.created_dt = this.sys.CurrentDate;
      this.masterModel.tmloanall.cc_flag = 'N';
      this.isLoading = true;
      this.svc.addUpdDel<any>('Loan/InsertLoanAccountOpeningData', this.masterModel).subscribe(
        res => {
          this.isSave=true;
          
          // debugger;
          this.isLoading = false;
          
          this.HandleMessage(true, MessageType.Sucess, 'Loan Account Created Successfully. LoanId: ' + this.tm_loan_all.loan_id);
          // this.modalRef = this.modalService.show(this.content2, this.config);
          setTimeout(() => {
            this.UnlocklockLoanID();
              this.initializeModels();
              this.resetAllForm();
              this.backScreen();
          }, 1000);
          },
        err => {
          // debugger;
          this.isLoading = false;
          console.error('Error on SaveClick' + JSON.stringify(err));
          // this.showAlertMsg('ERROR', 'Record Not Saved !!!');
          this.HandleMessage(true, MessageType.Error, 'Record Not Saved !!!');
  
        }
      );
    }
    resetAllForm(){
    this.stepper.selectedIndex = 0;
    this.firstFormGroup.reset();
    this.secondFormGroup.reset();
    this.thirdFormGroup.reset();

    this.intt_on_slab=0;
    this.sanc_per_grm=0;
    this.showLien=true;
    this.tdJewelry=[];
    this.loanDetails.clear();
    this.selectedLockDeposit=[];
    this.tot_eligibility =0;
    const temp_td = new td_jewelry();
    this.tdJewelry.push(temp_td);
    
    this.tm_loan_all= new tm_loan_all();
    this.td_accholder=[]
    const temp_td_accholder = new td_accholder();
    this.td_accholder.push(temp_td_accholder);
    this.masterModel = new LoanOpenDM();
    this.loanIdCreation=false;
    this.jewellerySave=false;
    this.jewlSecuritySave=false;
    this.sanctionChange=false;
    this.setLoanAccountType(24043)
  this.safe_name=''
  this.sanc_validity='';
  this.userType=localStorage.getItem('userType');
  this.showNoName=false;
  this.showNoJoint=false;
  this.disabledOnNull=true;
  this.disableLoanId=true;
  this.disabledJointOnNull=true;
  this.suggestedCustomerJointHolderIdx=0;
  this.selectedAccType=0
  this.isLoading = false;
  this.showNoResult=false;
  this.loan_id='';
  this.abc='';
  this.sanc_perc='';
  this.hideJoint=false;
  this.custKYC=false;
  this.goldSec=false;
  this.govCertSec=false;
  this.depositSec=false;
  this.landSec=false;
  this.guaranterSec=false;
  this.licSec=false;
  this.stockSec=false;
  this.tot_desc_no=0;
  this.tot_gross_we=0;
  this.tot_alloy_stone_we=0;
  this.tot_net_we=0;
  this.tot_purity_we=0;
  this.tot_act_we=0;
  this.tot_net_value=0;
  this.tot_act_rate=0;
  this.tot_eligibility=0;
  this.tot_sanction=0;
  this.currentSelectedSlab=''
  this.noCustSelect=true;
  this.imagePreview = null;
  this.amountError = null;
  this.mindueDate='';
  this.intt_on_slab=0;
  this.slab_range=0;
  this.safe_id='';
  this.sanc_per_grm=0;
  
  this.tot_eligibility=0;
  this.inttRtData={};
  this.firstFormGroup = this._formBuilder.group({
    cust_cd: [0, Validators.required],
    cust_name: ['', Validators.required],
    loan_acc_cd:[24043],
    guardian_name:[''],
    lbr:[''],
    age:[0],
    dt_of_birth:[null],
    sex:[''],
    marital_status:[''],
    catg_cd:[0],
    community:[0],
    caste:[0],
    email_id:[''],
    sms_flag:[''],
    phone:[''],
    address:[''],
    pan:[''],
    aadhar:[''],
    l_id:['']
  });
  this.secondFormGroup = this._formBuilder.group({
    loanDetails: this._formBuilder.array([]) // Initialize FormArray
  });
  this.thirdFormGroup = this._formBuilder.group({
    loan_id: ['', Validators.required],
    acc_cd: ['', Validators.required],
    sector_cd:[0],
    activity_cd:[0],
    sanc_amt:[0],
    sanc_no:[1],
    sanc_date:[''],
    validity_dt:['']
  });
  this.createLoanDetailGold();
    }
  
    initializeModels() {



      this.masterModel = new LoanOpenDM();
  
      const loan = new tm_loan_all();
      this.tm_loan_all = loan;
      this.masterModel.tmloanall = this.tm_loan_all;
  
      const guar = new tm_guaranter();
      this.tm_guaranter = guar;
      this.masterModel.tmguaranter = this.tm_guaranter;
  
      const acc: td_accholder[] = [];
      this.td_accholder = acc;
      this.masterModel.tdaccholder = this.td_accholder;
  
      const loansanc: tm_loan_sanction[] = [];
      this.tm_loan_sanction = loansanc;
      this.masterModel.tmlaonsanction = this.tm_loan_sanction;
  
      const loansancdtl: tm_loan_sanction_dtls[] = [];
      this.tm_loan_sanction_dtls = loansancdtl;
      this.masterModel.tmlaonsanctiondtls = this.tm_loan_sanction_dtls;
  
    }
    unlienDepAC(acc_type_cd,acc_num){
      debugger
      var data = {
        "ardb_cd": this.sys.ardbCD,
        "brn_cd": this.sys.BranchCode,
        "acc_type_cd": acc_type_cd,
        "acc_num": acc_num,
        "loan_id": this.masterModel.tmloanall.loan_id,
        "lock_mode": 'U',
        "modified_by": this.sys.UserId,
      }
        var ret = 0;
  
        this.svc.addUpdDel<any>('Deposit/UpdateDepositLockUnlock', data).subscribe(
          res => {
            // //debugger;
            ret = res;
            this.isLoading = false;
            this.HandleMessage(true, MessageType.Sucess, 'Sucessfully unlock lien account !!');
           
          },
          err => {
            //debugger;
            this.isLoading = false;
            this.HandleMessage(true, MessageType.Error, 'Error, While unlock lien account !!');
          }
        );
    }
  lienDepAC(acc_type_cd,acc_num){

    var data = {
      "ardb_cd": this.sys.ardbCD,
      "brn_cd": this.sys.BranchCode,
      "acc_type_cd": acc_type_cd,
      "acc_num": acc_num,
      "loan_id": this.masterModel.tmloanall.loan_id,
      "lock_mode": 'L',
      "modified_by": this.sys.UserId,
    }
      var ret = 0;

      this.svc.addUpdDel<any>('Deposit/UpdateDepositLockUnlock', data).subscribe(
        res => {
          // //debugger;
          ret = res;
          this.isLoading = false;
          this.HandleMessage(true, MessageType.Sucess, 'Sucessfully added lien account !!');

        },
        err => {
          //debugger;
          this.isLoading = false;
          this.HandleMessage(true, MessageType.Error, 'Error, While adding lien account !!');
        }
      );
  }
  stockFinalValue(event,i){
    console.log(this.loanDetails.value)
    // const newSlNo = i;
    // this.loanDetails.push(this.createLoanDetail(newSlNo));
    // console.log(event.target.value,i);
    const currentGroup = this.loanDetails.at(i) as FormGroup;
    currentGroup.patchValue({
      final_value:((+event.target.value).toFixed(0)),

    });
    console.log(this.loanDetails.value)
    if(this.userType=='A'){
      this.thirdFormGroup.controls['sanc_amt'].enable();
    }else{
      this.thirdFormGroup.controls['sanc_amt'].disable();
    }
  // this.thirdFormGroup.controls['sanc_amt'].disable();

    // this.loanDetails.value[index].final_value=event.target.value,index
    // this.loanDetails.value[index].sec_type == 'S'?
  }
  goldFinalValue(event){
    console.log(event);
    const currentGroup = this.loanDetails.at(0) as FormGroup;
    currentGroup.patchValue({
    final_value:((+event).toFixed(0)),
    loan_id:this.loan_id

  });
  this.thirdFormGroup.patchValue({
    sanc_amt:(+event).toFixed(0)
  })
  if(this.userType=='A'){
    this.thirdFormGroup.controls['sanc_amt'].enable();
  }else{
    this.thirdFormGroup.controls['sanc_amt'].disable();
  }
  // this.thirdFormGroup.controls['sanc_amt'].disable();
  console.log(this.loanDetails.value)

}
  skipSequrity(){
    this.thirdFormGroup.patchValue({
      sanc_amt:0,
      loan_id:this.loan_id,
      acc_cd:this.loanDetails.value[0]?.acc_cd,
      sanc_date:this.sys.CurrentDate,
      validity_dt:this.getPlus1Month(),
      sector_cd:'O',
      activity_cd:'99'
    });
    this.thirdFormGroup.controls['sanc_amt'].enable();
  }
  licFinalValue(event,i){
      console.log(event.target.value,i);
      const currentGroup = this.loanDetails.at(i) as FormGroup;
      currentGroup.patchValue({
      final_value:((+event.target.value).toFixed(0)),

    });
    if(this.userType=='A'){
      this.thirdFormGroup.controls['sanc_amt'].enable();
    }else{
      this.thirdFormGroup.controls['sanc_amt'].disable();
    }
    // this.thirdFormGroup.controls['sanc_amt'].disable();
    console.log(this.loanDetails.value)

  }
  landFinalValue(event,i){
    console.log(event.target.value,i);
    const currentGroup = this.loanDetails.at(i) as FormGroup;
    currentGroup.patchValue({
    final_value:((+event.target.value).toFixed(0)),

    });
  // this.thirdFormGroup.controls['sanc_amt'].disable();
  if(this.userType=='A'){
    this.thirdFormGroup.controls['sanc_amt'].enable();
  }else{
    this.thirdFormGroup.controls['sanc_amt'].disable();
  }
  }
  CCFinalValue(event,i){
    console.log(event.target.value,i);
    const currentGroup = this.loanDetails.at(i) as FormGroup;
    currentGroup.patchValue({
    final_value:((+event.target.value).toFixed(0)),

  });
  // this.thirdFormGroup.controls['sanc_amt'].disable();
  if(this.userType=='A'){
    this.thirdFormGroup.controls['sanc_amt'].enable();
  }else{
    this.thirdFormGroup.controls['sanc_amt'].disable();
  }
  }
  getLoanData(){
    this.isLoading=true;
    this.tm_loan_all.brn_cd = this.sys.BranchCode;
    this.tm_loan_all.ardb_cd=this.sys.ardbCD;
    this.tm_loan_all.loan_id=this.loan_id
    this.svc.addUpdDel<any>('Loan/GetLoanData', this.tm_loan_all).subscribe(
          res => {
            
            this.isLoading = false;
            this.masterModel = res;
            if (this.masterModel?.tmloanall?.party_cd){
              this.setLoanAccountType(this.masterModel?.tmloanall?.acc_cd)
              this.getNetWorth(this.masterModel?.tmloanall?.party_cd)
              this.depositList=[]
                this.depositList.push({ ardb_cd: "1", cust_cd: this.masterModel?.tmloanall?.party_cd});
                console.log(this.depositList);
                if(this.depositList){
                  this.getAllDeposit(this.depositList);
                }
              this.getCustomer(this.masterModel?.tmloanall?.party_cd);
              this.getSecurityData(this.masterModel?.tmloanall?.loan_id);
              this.tm_guaranter=this.masterModel?.tmguaranter;
              this.td_accholder=this.masterModel?.tdaccholder;
              this.tm_loan_all=this.masterModel?.tmloanall;
              this.intt_on_slab=this.masterModel?.tmloanall?.curr_intt_rate;
              this.tm_loan_sanction_dtls.push(this.masterModel?.tmlaonsanctiondtls[0]);
              this.tm_loan_sanction.push(this.masterModel?.tmlaonsanction[0]);
              this.thirdFormGroup.patchValue({
                sanc_amt:this.masterModel?.tmlaonsanctiondtls[0]?.sanc_amt,
                loan_id:this.masterModel?.tmlaonsanctiondtls[0]?.loan_id,
                acc_cd:this.masterModel?.tmloanall?.acc_cd,
                sanc_date:this.masterModel?.tmlaonsanction[0]?.sanc_dt,
                validity_dt:this.masterModel?.tmlaonsanctiondtls[0]?.due_dt,
                sector_cd:this.masterModel?.tmlaonsanctiondtls[0]?.sector_cd,
                activity_cd:this.masterModel?.tmlaonsanctiondtls[0]?.activity_cd
              });
              if(this.userType=='A'){
                this.thirdFormGroup.controls['sanc_amt'].enable();
              }else{
                this.thirdFormGroup.controls['sanc_amt'].disable();
              }
              // this.thirdFormGroup.controls['sanc_amt'].disable();
              // this.thirdFormGroup.controls['due_dt'].disable();
              this.thirdFormGroup.controls['sector_cd'].disable();
              this.thirdFormGroup.controls['activity_cd'].disable();
              // this.thirdFormGroup.controls['sanc_dt'].disable();

            }
            console.log(res)
            if (this.masterModel === undefined || this.masterModel === null) {
              this.isLoading = false;
              this.HandleMessage(true, MessageType.Warning, 'No record found!!' );
            }
            else {
              this.isLoading = false;
              if (res.tmlaonsanctiondtls) {
                this.tot_eligibility=res.tmlaonsanctiondtls[0].sanc_amt;
                this.thirdFormGroup.controls['sanc_amt'].setValue(res.tmlaonsanctiondtls[0].sanc_amt);
              }
              else {
                this.HandleMessage(true, MessageType.Warning, 'No record found!!!');
              }
    
            }
    
          },
          err => {
            this.isLoading = false;
            this.HandleMessage(true, MessageType.Warning, 'Unable to find record!!' );
          }
    
        );
  }
  getSecurityData(loan_id){
    // const dt={
    //   "ardb_cd": this.sys.ardbCD,
    //   "brn_cd": this.sys.BranchCode,
    //   "loan_id": loan_id
    // }
    this.svc.addUpdDel<any>(`Loan/GetLoanSecurityData?loan_id=${loan_id}`, null).subscribe(
      res => {
        console.log(res)
        this.isLoading=false;
        if (undefined !== res && null !== res && res.length > 0) {
          console.log(this.loanDetails.value)
          this.tot_eligibility=res[0]?.final_value;
          
          this.loanDetails.clear();
          res.forEach((item) => {
            debugger
          this.loanDetails.push(
            this._formBuilder.group({
              
              loan_id: [item?.loan_id], // Assign loan_id
              acc_cd: [item?.acc_cd], // Assign account code
              sec_type: [item?.sec_type], // Assign security type
              sl_no: [item?.sl_no], // Assign serial number
              acc_type_cd: [item?.acc_type_cd], // Assign account type code
              acc_num: [item?.acc_num], // Assign account number
              opn_dt: [this.formateDate(item?.opn_dt)], // Assign opening date
              mat_dt: [this.formateDate(item?.mat_dt)], // Assign maturity date
              prn_amt: [item?.prn_amt], // Assign principal amount
              mat_val: [this.formateDate(item?.mat_val)], // Assign maturity value
              curr_bal: [item?.curr_bal], // Assign current balance
              cert_type: [item?.cert_type], // Assign certificate type
              cert_name: [item?.cert_name], // Assign certificate name
              cert_no: [item?.cert_no], // Assign certificate number
              regn_no: [item?.regn_no], // Assign registration number
              post_off: [item?.post_off], // Assign post office
              cert_opn_dt: [this.formateDate(item?.cert_opn_dt)], // Assign certificate opening date
              cert_mat_dt: [this.formateDate(item?.cert_mat_dt)], // Assign certificate maturity date
              cert_pdlg_dt: [this.formateDate(item?.cert_pdlg_dt)], // Assign certificate pledge date
              cert_plg_no: [item?.cert_plg_no], // Assign certificate pledge number
              purchase_value: [item?.purchase_value], // Assign purchase value
              sum_assured: [item?.sum_assured], // Assign sum assured
              pol_type: [item?.pol_type], // Assign policy type
              pol_name: [item?.pol_name], // Assign policy name
              pol_no: [item?.pol_no], // Assign policy number
              pol_opn_dt: [this.formateDate(item?.pol_opn_dt)], // Assign policy opening date
              pol_mat_dt: [this.formateDate(item?.pol_mat_dt)], // Assign policy maturity date
              pol_sur_val: [item?.pol_sur_val], // Assign policy surrender value
              pol_brn_name: [item?.pol_brn_name], // Assign policy branch name
              pol_assgn_no: [item?.pol_assgn_no], // Assign policy assignment number
              pol_assgn_dt: [this.formateDate(item?.pol_assgn_dt)], // Assign policy assignment date
              pol_money_bk: [item?.pol_money_bk], // Assign policy money-back details
              pol_sum_assured: [item?.pol_sum_assured], // Assign policy sum assured
              prop_type: [item?.prop_type], // Assign property type
              prop_addr: [item?.prop_addr], // Assign property address
              total_land_area: [item?.total_land_area], // Assign total land area
              tot_cv_area: [item?.tot_cv_area], // Assign total covered area
              deed_no: [item?.deed_no], // Assign deed number
              distct: [item?.distct], // Assign district
              ps: [item?.ps], // Assign police station
              mouza: [item?.mouza], // Assign mouza
              jl_no: [item?.jl_no], // Assign JL number
              rs_kha: [item?.rs_kha], // Assign RS Khatian number
              lr_kha: [item?.lr_kha], // Assign LR Khatian number
              rs_dag: [item?.rs_dag], // Assign RS Dag number
              lr_dag: [item?.lr_dag], // Assign LR Dag number
              deed_muni: [item?.deed_muni], // Assign deed municipality
              ward_no: [item?.ward_no], // Assign ward number
              holding_no: [item?.holding_no], // Assign holding number
              boundry: [item?.boundry], // Assign boundary details
              cnst_yr: [item?.cnst_yr], // Assign construction year
              floor_area: [item?.floor_area], // Assign floor area
              mkt_val: [item?.mkt_val], // Assign market value
              tax_upto: [this.formateDate(item?.tax_upto)], // Assign tax paid up to date
              bl_ro_tax: [item?.bl_ro_tax], // Assign BL/RO tax details
              mort_deed_reg_no: [item?.mort_deed_reg_no], // Assign mortgage deed registration number
              mort_deed_dt: [this.formateDate(item?.mort_deed_dt)], // Assign mortgage deed date
              gold_gross_wt: [item?.gold_gross_wt], // Assign gold gross weight
              gold_net_wt: [item?.gold_net_wt], // Assign gold net weight
              karat: [item?.karat], // Assign gold karat
              gold_desc: [item?.gold_desc], // Assign gold description
              gold_qty: [item?.gold_qty], // Assign gold quantity
              gold_val: [item?.gold_val], // Assign gold value
              stock_type: [item?.stock_type], // Assign stock type
              stock_value: [item?.stock_value], // Assign stock value
              final_value: [item?.final_value], // Assign final value
              created_by: [item?.created_by], // Assign created by
              created_dt: [item?.created_dt], // Assign created date
              modified_by: [item?.modified_by], // Assign modified by
              modified_dt: [item?.modified_dt], // Assign modified date
              intt_on_slab: [this.intt_on_slab], // Assign modified date
            }))})
            if(res[0].sec_type=='G'){
              this.getGoldSecurityData(loan_id);
              this.sanctionChange=true;
            }
        } else {
          this.HandleMessage(true, MessageType.Warning, 'No Security Data Found' );
          this.isLoading=false;
          if(this.masterModel.tmloanall.acc_cd==24043){
            this.loanDetails.push(this.createLoanDetailGold());
            this.tot_eligibility=this.masterModel.tmlaonsanctiondtls[0].sanc_amt;
          }
          else{
          const newSlNo = 1;
            this.loanDetails.push(this.createLoanDetail(newSlNo));
            this.tot_eligibility=this.masterModel.tmlaonsanctiondtls[0].sanc_amt;
          }
          
        }
      },
      err => { this.isLoading = false; }
    );
  }
  getGoldSecurityData(loan_id){
        this.svc.addUpdDel<any>('Loan/GetGoldMasterDtls', {"loan_id":loan_id}).subscribe(
          res => {
            console.log(res)
            this.isLoading=false;
            if (undefined !== res && null !== res && res.length > 0) {
              if(this.isRetrive){
                this.safe_id=this.goldSafeData.filter(e=>e.goldSafeId== res[0]?.goldsafe_id)[0]?.goldSafeName;
                this.safe_name=res[0]?.goldsafe_id;
                this.sanc_perc=res[0]?.slab_range;
                this.sanc_per_grm=res[0].act_rate;
               this.intt_on_slab=this.allSlabList.filter(e=>e.sanc_perc==res[0].slab_range)[0]?.inttRate;
              }
              res.forEach((item) => {
              this.tdJewelry.push(item);
              
            })
            if(this.tdJewelry.length>0){
              this.calculateTotals();
            }
            } else {
              this.suggestedCustomer = [];
              this.showNoResult=true;
            }
          },
          err => { this.isLoading = false; }
        );
  }
  getCustomer(cust_cd){
    const prm = new p_gen_param();
        prm.as_cust_name = cust_cd;
        prm.ardb_cd = this.sys.ardbCD;
        this.svc.addUpdDel<any>('Deposit/GetCustDtls', prm).subscribe(
          res => {
            console.log(res)
            this.isLoading=false;
            if (undefined !== res && null !== res && res.length > 0) {
              this.suggestedCustomer = res
              this.SelectCustomer(res[0])
              this.showNoResult=false
            } else {
              this.suggestedCustomer = [];
              this.showNoResult=true;
            }
          },
          err => { this.isLoading = false; }
        );
  }
  closeModal(){
    this.modalRef.hide();
    this.router.navigate([this.sys.BankName + '/la']);
  }
  retriveClick(){
    this.isRetrive=true;
  }
  ngOnDestroy(): void {
    console.log(this.isSave);
    
    if(this.isSave || this.isRetrive){
      this.UnlocklockLoanID();
    }
    else{
      if(this.loanDetails.value[0]?.sec_type == 'G'){
        this.DeleteGoldMasterDtls();
        // this.DeleteLoanSecurityData();
        debugger
      }
      else if(this.loanDetails.value[0]?.sec_type == 'D'){
        this.loanDetails.value.forEach(e=>{
          this.unlienDepAC(e.acc_type_cd,e.acc_num);
        })
      }
      else{
        // this.DeleteLoanSecurityData();
      debugger
      }
      this.UnlocklockLoanID();
    }
    
  }
  getKYCDtls(cust_cd){
    debugger
    this.msg.sendcustomerCodeForKyc(cust_cd);
    // this.openModal(kycContent)
    this.modalRef = this.modalService.show(this.kycContent, {
      keyboard: false, // ensure esc press doesnt close the modal
      backdrop: true, // enable backdrop shaded color
      ignoreBackdropClick: true, // disable backdrop click to close the modal
      class: 'modal-lg'
    });
  }
  
  formateDate(dt){
    // Split the input date into parts
    // const [day, month, year] = dt.split(' ')[0].split('/');

    // Format the date as YYYY-MM-DD
    // const formattedDate = `${year}-${month}-${day}`;
    // return formattedDate
    return dt
  }
}
////24041-BL
////24042-LD
////24043-GL