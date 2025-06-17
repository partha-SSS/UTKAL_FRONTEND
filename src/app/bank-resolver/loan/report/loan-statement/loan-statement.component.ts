import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SystemValues, p_report_param, mm_customer } from 'src/app/bank-resolver/Models';
import { p_gen_param } from 'src/app/bank-resolver/Models/p_gen_param';
import { tt_trial_balance } from 'src/app/bank-resolver/Models/tt_trial_balance';
import { RestService } from 'src/app/_service';
import Utils from 'src/app/_utility/utils';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as'
import { MatTableDataSource } from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';
@Component({
  selector: 'app-loan-statement',
  templateUrl: './loan-statement.component.html',
  styleUrls: ['./loan-statement.component.css'],
  providers: [ExportAsService]
})
export class LoanStatementComponent implements OnInit {
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  disabledOnNull = true;
  modalRef: BsModalRef;
  isOpenFromDp = false;
  isOpenToDp = false;
  counter = 0;
  filteredArray:any=[]
  sys = new SystemValues();
  // displayedColumns: string[] = ['trans_dt', 'disb_amt', 'curr_intt_cal', 'ovd_intt_cal','last_intt_calc_dt','prn_trf','intt_trf','curr_intt_recov','ovd_intt_recov','curr_prn_recov','adv_prn_recov','ovd_prn_recov','curr_prn','ovd_prn','curr_intt','ovd_intt',];
  dataSource = new MatTableDataSource()
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true, // disable backdrop click to close the modal
    class: 'modal-lg'
  };
  trailbalance: tt_trial_balance[] = [];
  prp = new p_report_param();
  reportcriteria: FormGroup;
  closeResult = '';
  showReport = false;
  showAlert = false;
  isLoading = false;
  ReportUrl: SafeResourceUrl;
  UrlString = '';
  alertMsg = '';
  fd: any;
  td: any;
  dt: any;
  fromdate: Date;
  toDate: Date;
  exportAsConfig: ExportAsConfig;
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData: any = [];
  inttRate:any='';
  ardbName = localStorage.getItem('ardb_name')
  branchName = this.sys.BranchName

  pageChange: any;
  opdrSum = 0;
  opcrSum = 0;
  drSum = 0;
  crSum = 0;
  clsdrSum = 0;
  clscrSum = 0;
  lastAccCD: any;
  today: any
  cName: any
  cAddress: any
  cAcc: any
  lastAccNum: any
  currInttSum = 0
  ovdInttSum = 0
  ovdPrnSum = 0
  currPrnSum = 0
  currInttRecovSum = 0
  ovdInttRecovSum = 0
  ovdPrnRecovSum = 0
  currPrnRecovSum = 0
  totPrn = 0;
  loanId: any;
  custNm:any;
  addr:any;
  ucic:any;
  suggestedCustomer: mm_customer[];
  recovSum=0;
  disbSum=0;
  lastDt:any;
  lastCd:any;
  penalInttSum=0
  penalInttRecovSum=0;
  advPrnRecovSum=0;
  showWait=false
  resultLength=0;
  currInttCalSum = 0
  ovdInttCalSum = 0
  penalInttCalSum=0
  notvalidate:boolean=false;
  date_msg:any;
  constructor(private svc: RestService, private formBuilder: FormBuilder,
    private modalService: BsModalService, private _domSanitizer: DomSanitizer, private exportAsService: ExportAsService, private cd: ChangeDetectorRef,
    private router: Router, private comser: CommonServiceService) { }
  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.fromdate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
      acct_num: [null, Validators.required]
    });
    this.onLoadScreen(this.content);
    var date = new Date();
    var n = date.toDateString();
    var time = date.toLocaleTimeString();
    this.today = n + " " + time
  }
  onLoadScreen(content) {
    this.notvalidate=false
    this.modalRef = this.modalService.show(content, this.config);
  }
  cancelOnNull() {
    this.suggestedCustomer = null;
    if (this.reportcriteria.controls.acct_num.value.length > 0) {
      this.disabledOnNull = false;
    }
    else {
      this.disabledOnNull = true
    }
  }
  setPage(page: number) {
    this.currentPage = page;
    this.cd.detectChanges();
  }
  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedItems = this.reportData.slice(startItem, endItem); //Retrieve items for page
    console.log(this.pagedItems)

    this.cd.detectChanges();
  }
  public suggestCustomer(): void {
    // debugger;
    this.showWait=true
    this.isLoading = true;
    if (this.reportcriteria.controls.acct_num.value.length > 0) {
      const prm = new p_gen_param();
      prm.as_cust_name = this.reportcriteria.controls.acct_num.value.toLowerCase();
      prm.ardb_cd = this.sys.ardbCD
      this.svc.addUpdDel<any>('Loan/GetLoanDtlsByID', prm).subscribe(
        res => {
          this.isLoading = false
          console.log(res)
          if (undefined !== res && null !== res && res.length > 0) {
            this.suggestedCustomer = res;
          } else {
            this.isLoading = false
            this.suggestedCustomer = [];
          }
          this.showWait=false;
        },
        err => { this.isLoading = false; }
      );
    } else {
      this.isLoading = false;
      this.suggestedCustomer = null;
    }
  }

  public SelectCustomer(cust: any): void {
    console.log(cust)
    const date = Utils.convertStringToDt(cust.disb_dt);
    this.fromdate = date;
    this.toDate=this.sys.CurrentDate;
    this.loanId=cust.loan_id;
    this.custNm=cust.cust_name;
   
    this.addr=cust.present_address;
    this.reportcriteria.controls.acct_num.setValue(cust.loan_id);
    this.suggestedCustomer = null;
  }
  getTotal(field: string): string {
    if(this.reportData.length>0){
      return this.reportData((sum, item) => sum + (item[field] || 0), 0).toFixed(2);

    }
    else{
    return '0.0';

    }
  }
  public SubmitReport() {
    // this.comser.getDay(this.fromdate,this.toDate)

    if (this.reportcriteria.invalid) {
      this.showAlert = true;
      this.alertMsg = 'Invalid Input.';
      return false;
    }
    else if(this.reportcriteria.controls.fromDate.value>this.reportcriteria.controls.toDate.value){
      this.date_msg= this.comser.date_msg
      this.notvalidate=true
    }

    else {
      this.ovdInttSum=0
      this.currInttSum=0
      this.currPrnSum=0
      this.ovdPrnSum=0
      this.ovdInttRecovSum=0
      this.currInttRecovSum=0
      this.currPrnRecovSum=0
      this.ovdPrnRecovSum=0
      this.penalInttSum=0
      this.penalInttCalSum=0
      this.ovdInttCalSum=0
      this.currInttCalSum=0
      this.penalInttRecovSum=0
      this.advPrnRecovSum=0
      // this.totPrn+=e.ovd_prn+e.curr_prn
      this.recovSum=0
      this.disbSum=0
      this.reportData.length=0;
      this.pagedItems.length=0;
      this.modalRef.hide();
      this.isLoading=true
      this.fromdate = this.reportcriteria.controls.fromDate.value;
      this.toDate = this.reportcriteria.controls.toDate.value;
      var dt = {
        "ardb_cd": this.sys.ardbCD,
        "brn_cd": this.sys.BranchCode,
        "loan_id": this.reportcriteria.controls.acct_num.value,
        // "from_dt": this.fromdate.toISOString(),
        "from_dt": this.fromdate,
        // "to_dt": this.toDate.toISOString()
        "to_dt": this.toDate
      }
      this.svc.addUpdDel('Loan/PopulateLoanStatement', dt).subscribe(data => {
        console.log(data)
        this.reportData = data
        if(!this.reportData){
          this.isLoading = false
          this.comser.SnackBar_Nodata();
        }
        else{
           this.inttRate=this.reportData[0].curr_intt_rate?this.reportData[0].curr_intt_rate:0;
           this.ucic=this.reportData[0].cust_cd?this.reportData[0].cust_cd:0;
            this.isLoading = false
            this.reportData.forEach(e => {
            this.ovdInttSum+=e.ovd_intt
            this.currInttSum+=e.curr_intt
            this.currPrnSum+=e.curr_prn
            this.ovdPrnSum+=e.ovd_prn
            this.ovdInttRecovSum+=e.ovd_intt_recov
            this.currInttRecovSum+=e.curr_intt_recov
            this.currPrnRecovSum+=e.curr_prn_recov
            this.ovdPrnRecovSum+=e.ovd_prn_recov
            this.penalInttSum+=e.penal_intt
            this.currInttCalSum+=e.curr_intt_calculated
            this.ovdInttCalSum+=e.other_charges_recov
            this.penalInttCalSum+=e.penal_intt_calculated
            this.penalInttRecovSum+=e.penal_intt_recov
            this.advPrnRecovSum+=e.adv_prn_recov
            // this.totPrn+=e.ovd_prn+e.curr_prn
            this.recovSum+=e.recov_amt
            this.disbSum+=e.disb_amt
          });
        }
        // this.itemsPerPage = this.reportData.length % 50 <= 0 ? this.reportData.length : this.reportData.length % 50
        // if(this.reportData.length<50){
        //   this.pagedItems=this.reportData
        // }
        // this.pageChange = document.getElementById('chngPage');
        // this.pageChange?.click()
        // this.setPage(2);
        // this.setPage(1)
        // this.modalRef.hide();
        // this.dataSource.data=this.reportData
        // // for(let i=0;i<50;i++)
        // // this.dataSource.data.push(this.reportData)
        // this.dataSource.paginator = this.paginator;
        // this.dataSource.sort = this.sort;
        // this.resultLength=this.reportData.length
        // this.lastAccNum=this.reportData[this.reportData.length-1].acc_num
        
        // this.lastCd=this.reportData[this.reportData.length-1].trans_cd
        // this.lastDt=this.reportData[this.reportData.length-1].trans_dt
      },
      err => {
         this.isLoading = false;
         this.comser.SnackBar_Error(); 
        }
      
      )
      // this.modalRef.hide();
      // setTimeout(() => {
      //   this.isLoading = false;
      // }, 10000);
    }
  }
  public oniframeLoad(): void {
    this.counter++
    if (this.counter == 2) {
      this.isLoading = false;

    }
    else {
      this.isLoading = true;
    }
    this.modalRef.hide();
  }
  public closeAlert() {
    this.showAlert = false;
  }


  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
  applyFilter(event: Event) {
    console.log(event)
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.getTotal1()
  }
  getTotal1(){
    this.ovdInttSum=0
      this.currInttSum=0
      this.currPrnSum=0
      this.ovdPrnSum=0
      this.ovdInttRecovSum=0
      this.currInttRecovSum=0
      this.currPrnRecovSum=0
      this.ovdPrnRecovSum=0
      this.penalInttSum+=0
      this.penalInttRecovSum=0
      this.advPrnRecovSum=0
      // this.totPrn+=e.ovd_prn+e.curr_prn
      this.recovSum=0
      this.disbSum=0
      this.currInttCalSum=0
      this.ovdInttCalSum=0
      this.penalInttCalSum=0

      

     
    console.log(this.dataSource.filteredData)
    this.filteredArray=this.dataSource.filteredData
    this.filteredArray.forEach(e => {
      this.ovdInttSum+=e.ovd_intt
      this.currInttSum+=e.curr_intt
      this.currPrnSum+=e.curr_prn
      this.ovdPrnSum+=e.ovd_prn
      this.ovdInttRecovSum+=e.ovd_intt_recov
      this.currInttRecovSum+=e.curr_intt_recov
      this.currPrnRecovSum+=e.curr_prn_recov
      this.ovdPrnRecovSum+=e.ovd_prn_recov
      this.penalInttSum+=e.penal_intt
      this.penalInttRecovSum+=e.penal_intt_recov
      this.advPrnRecovSum+=e.adv_prn_recov
      // this.totPrn+=e.ovd_prn+e.curr_prn
      this.recovSum+=e.recov_amt
      this.disbSum+=e.disb_amt
      this.currInttCalSum+=e.curr_intt_calculated
          this.ovdInttCalSum+=e.ovd_intt_calculated
          this.penalInttCalSum+=e.penal_intt_calculated
    });
  }

}
