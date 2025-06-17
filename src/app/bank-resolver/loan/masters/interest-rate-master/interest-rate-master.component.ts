import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';
import { MessageType, mm_acc_type, mm_category, mm_customer, ShowMessage, SystemValues } from 'src/app/bank-resolver/Models';
import { InAppMessageService, RestService } from 'src/app/_service';
import { HttpParams } from '@angular/common/http';
@Component({
  selector: 'app-interest-rate-master',
  templateUrl: './interest-rate-master.component.html',
  styleUrls: ['./interest-rate-master.component.css']
})
export class InterestRateMasterComponent {
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  @ViewChild('content2', { static: true }) content2: TemplateRef<any>;
  modalRef: BsModalRef;
  isOpenFromDp = false;
  isOpenToDp = false;
  selectedAccCd:any;
  sys = new SystemValues();
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true, // disable backdrop click to close the modal
    class: 'modal-lg'
  };
  currentDate: Date;
  passBookData:any[]=[];
  locker: FormGroup;
  closeResult = '';
  showReport = false;
  showAlert = false;
  isLoading = false;
  UrlString = '';
  alertMsg = '';
  fd: any;
  td: any;
  dt: any;
  fromdate: Date;
  toDate: Date;
  suggestedCustomer: mm_customer[];
  disabledOnNull=true
  counter=0
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData:any=[]
  ardbName=localStorage.getItem('ardb_name')
  branchName=this.sys.BranchName

  pageChange: any;
  opdrSum=0;
  opcrSum=0;
  drSum=0;
  crSum=0;
  clsdrSum=0;
  clscrSum=0;
  lastAccCD:any;
  today:any
  cName:any
  cAddress:any
  cAcc:any
  showWait=false
  locker_type=[
    {type:"Small",id:"S"},
    {type:"Large",id:"L"},
    {type:"Mediam",id:"M"},
  ]
  locker_status=[
    {type:"Vacant",id:"V"},
    {type:"Allocated",id:"A"},
  ]

  
  constructor(private svc: RestService, private elementRef: ElementRef,private formBuilder: FormBuilder,
    private msg: InAppMessageService, private modalService: BsModalService,
    private router: Router, private comser:CommonServiceService) { }
    accountTypeList: mm_acc_type[]= [];
    categoryList:mm_category[]=[];
    param :any[]=[];
    isTrade: boolean = false;
    showMsg: ShowMessage;
    asOnDate : any;
    instalmentTypeList:any[]=[];
  ngOnInit(): void {
    console.log(window.location.hostname);
    this.getInstalmentTypeList();
    this.getAccountTypeList();
    // this.getCategoryList();
    this.getIntRate();
    this.asOnDate =this.sys.CurrentDate;
    
    this.locker = this.formBuilder.group({
      acc_cd: [null, Validators.required],
      eff_date: [null, Validators.required],
      intt_rt: [null, Validators.required],
      scheme_id: [null, Validators.required],
      scheme_name: [null, Validators.required],
      intt_calc_type: [null, Validators.required]
      
    });
    var date = new Date();
    // get the date as a string
       var n = date.toDateString();
    // get the time as a string
       var time = date.toLocaleTimeString();
       this.today= n + " "+ time
  }
  onLoadScreen(content) {
    this.modalRef = this.modalService.show(content, this.config);
  }
  onBackClick() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
  public closeAlert() {
    this.showAlert = false;
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
  // public onAccountTypeChange(): void {
  //   this.reportcriteria.controls.acct_num.setValue('');
  //   this.suggestedCustomer = null;
  //   if (+this.reportcriteria.controls.acc_type_cd.value > 0) {
  //     this.reportcriteria.controls.acct_num.enable();
  //   }
  // }
  // onChangeNull(){
  //   this.suggestedCustomer = null

  //   if (this.reportcriteria.controls.acct_num.value.length > 0) 
  //     this.disabledOnNull=false
  //   else 
  //     this.disabledOnNull=true
  // }

  SubmitReport(){
  this.onLoadScreen(this.content2)

}
  public getIntRate() {
    
      this.isLoading=true
      // const params = new HttpParams().set('acc_cd', Number(this.selectedAccCd));
      this.svc.addUpdDel(`Loan/GetLoanSchemeRateAll`,null).subscribe(data=>{
        console.log(data);
        debugger
        this.reportData=data;
        if(!this.reportData){
          this.comser.SnackBar_Nodata()
          this.isLoading=false
        } 
        else{
          // const mergedData = this.reportData.map(report => {
          //   const accountType = this.accountTypeList.find(accType => accType.acc_type_cd === report.acc_type_cd);
          //   const categoryList = this.categoryList.find(accType => accType.catg_cd === report.catg_cd);
          //   return {
          //     ...report,
          //     acc_type_desc: accountType ? accountType.acc_type_desc : null,
          //     catg_cd: categoryList ? categoryList.catg_cd : null
          //   };
          // });
          // this.reportData=mergedData;
          this.isLoading=false
        }
       
      })
  }
  getCategoryList() {
    this.svc.addUpdDel<any>('Mst/GetCategoryMaster', null).subscribe(
      res => {
        this.categoryList = res;
      },
      err => {
      }
    );
  }

  getAccountTypeList() {

    this.svc.addUpdDel<any>('Mst/GetAccountTypeMaster', null).subscribe(
      res => {
        this.accountTypeList = res;
        this.accountTypeList = this.accountTypeList.filter(c => c.dep_loan_flag === 'L');
        this.accountTypeList = this.accountTypeList.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
      },
      err => {
        ;
      }
    );
  }
  // changeTradesByCategory(isChecked: boolean,i:any) {
  //   console.log(i);
  //   console.log(isChecked);
    
  //   if(isChecked){
  //     this.passBookData[i].printed_flag='Y';

  //   }
  //   else{
  //     this.passBookData[i].printed_flag='N';

  //   }
  //   console.log( this.passBookData); 
    
  // }

  // allTrades(event) {
  //   ;
  //   const checked = event.target.checked;
  //   if(checked)
  //   this.accountTypeList.forEach(item => item.calc = true);
  //   else
  //   this.accountTypeList.forEach(item => item.calc = false);
  // }
  RentChange(event:any, i){
      console.log(event.target.value  ,i)
      const selectedValue = event.target.value;
      this.reportData[i].rentamt = selectedValue;
      
      debugger
  }
 
  // onUpdateClick()
  // {
  //   this.isLoading=true;
    
  //   this.reportData
  //   debugger
      
  //     this.svc.addUpdDel<any>('Loan/GetLoanSchemeRate', this.reportData).subscribe(
  //       res => {
  //         ;
  //         this.isLoading=false;
  //         this.HandleMessage(true, MessageType.Sucess, 'Interest Rate Update Successfull');
  //         this.getIntRate();
  //       },
  //       err => {
  //         ;
  //         this.isLoading=false;
  //         this.HandleMessage(true, MessageType.Error, 'Interest Rate Updation Failed!');
  //       }
  //     );

  //  }
   AddLocker(){
    this.onLoadScreen(this.content)
   }
   SaveInterest(){
    this.isLoading=true;
    this.modalRef.hide();
    const maxSchemeId = this.reportData.reduce((max, item) => (item.scheme_id > max ? item.scheme_id : max), 0);
    var originalDate = this.locker.controls.eff_date.value;
    var dateParts = originalDate.split("-");
    var formattedDate = dateParts[2] + "/" + dateParts[1] + "/" + dateParts[0] + " 00:00";

      var dt={
             
              "effective_dt":formattedDate,
              "ardb_cd": this.sys.ardbCD,
              "brn_cd": this.sys.BranchCode,
              "created_dt": formattedDate,
              "acc_cd":this.locker.controls.acc_cd.value,
              "scheme_id":Number(maxSchemeId)+1,
              "scheme_name":this.locker.controls.scheme_name.value,
              "intt_calc_type":this.locker.controls.intt_calc_type.value,
              "intt_rt":this.locker.controls.intt_rt.value
              // "created_by":this.sys.UserId+'/'+localStorage.getItem('ipAddress')
          }
    // this.reportData.push(dt);

    // console.log(this.reportData)
    debugger
      
      this.svc.addUpdDel<any>('Loan/InsertLoanSchemeRate', dt).subscribe(
        res => {
          
          this.isLoading=false;
          this.HandleMessage(true, MessageType.Sucess, 'New Interest Rate Added Successfull ');
          this.getIntRate();
          this.locker.reset();
        },
        err => {
          ;
          this.isLoading=false;
          this.HandleMessage(true, MessageType.Error, 'Interest Rate Insertion Failed!!!!!!!!!!');
        }
      );
   }
  /** Below method handles message show/hide */
  private HandleMessage(show: boolean, type: MessageType = null, message: string = null) {
    this.showMsg = new ShowMessage();
    this.showMsg.Show = show;
    this.showMsg.Type = type;
    this.showMsg.Message = message;
  }
}
