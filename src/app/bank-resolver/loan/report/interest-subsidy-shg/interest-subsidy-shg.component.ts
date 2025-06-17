import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild,AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SystemValues, p_report_param, mm_customer } from 'src/app/bank-resolver/Models';
import { tt_trial_balance } from 'src/app/bank-resolver/Models/tt_trial_balance';
import { RestService } from 'src/app/_service';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-interest-subsidy-shg',
  templateUrl: './interest-subsidy-shg.component.html',
  styleUrls: ['./interest-subsidy-shg.component.css']
})
export class InterestSubsidySHGComponent {
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  // @ViewChild(MatPaginator) paginator2: MatPaginator;
  // @ViewChild(MatSort) sort2: MatSort;
  dataSource= new MatTableDataSource()
  displayedColumns: string[] = ['SL','sb_acc_num','block_name','service_area_name','fund_type','loan_id','sanction_dt','party_name','phone','address','category','scheme','curr_intt_rate','disb_amt','disb_dt','p_out_balance','curr_intt_recov','c_out_balance','subsidy_amt','subsidy_rate'];
  notvalidate:boolean=false;
  date_msg:any;
  modalRef: BsModalRef;
  isOpenFromDp = false;
  isOpenToDp = false;
  sys = new SystemValues();
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true // disable backdrop click to close the modal
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
  counter = 0
  exportAsConfig: ExportAsConfig;
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData: any=[]
  filteredArray:any=[]
  filteredArray_o:any=[]
  ardbName = localStorage.getItem('ardb_name')
  branchName = this.sys.BranchName
  pageChange: any;
  tot_disb_amt = 0;
  tot_loan_balance = 0;
  tot_prn_recov = 0;
  tot_intt_recov = 0;
  tot_subsidy_amt = 0;
  lastAccCD: any;
  today: any
  apiUrl = '';
  frm_date:any;
  to_date:any;
  suggestedCustomer: mm_customer[];
  constructor(private svc: RestService,private datePipe:DatePipe, private formBuilder: FormBuilder,
    private modalService: BsModalService, private _domSanitizer: DomSanitizer, private exportAsService: ExportAsService, private cd: ChangeDetectorRef,
    private router: Router, private comser: CommonServiceService
    ) { }
  ngOnInit(): void {
    this.fromdate = this.sys.CurrentDate;
    this.toDate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required]
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
 
  setPage(page: number) {
    this.currentPage = page;
    this.cd.detectChanges();
  }
  public SubmitReport() {
    var date1=new Date(this.datePipe.transform(this.reportcriteria.controls.fromDate.value, 'yyyy-MM-dd'))
    console.log(date1);
    date1.setDate(date1.getDate() - 1);
    const formattedDate = this.datePipe.transform(date1, 'dd/MM/yyyy');
    console.log(formattedDate);
    this.frm_date=formattedDate;
    this.to_date=this.datePipe.transform(this.reportcriteria.controls.toDate.value, 'dd/MM/yyyy')
    
    this.comser.getDay(this.reportcriteria.controls.fromDate.value,this.reportcriteria.controls.toDate.value)
    if (this.reportcriteria.invalid) {
      this.showAlert = true;
      this.alertMsg = 'Invalid Input.';
      return false;
    }
    else if(this.comser.diff<0){
      this.date_msg= this.comser.date_msg
      this.notvalidate=true
    }
    else {
      this.modalRef.hide();
      this.reportData.length=0;
      this.pagedItems.length=0;
      this.isLoading=true;
      this.tot_disb_amt = 0;
      this.tot_loan_balance = 0;
      this.tot_prn_recov = 0;
      this.tot_intt_recov = 0;
      this.tot_subsidy_amt = 0;
      this.fromdate = this.reportcriteria.controls.fromDate.value;
      this.toDate = this.reportcriteria.controls.toDate.value;
      var dt = {
        "ardb_cd": this.sys.ardbCD,
        "from_dt": this.fromdate.toISOString(),
        "to_dt": this.toDate.toISOString(),
        "brn_cd": this.sys.BranchCode
      }
        this.svc.addUpdDel('Loan/PopulateInterestSubsidySHG', dt).subscribe(data => {
          console.log(data)
          this.reportData = data;
          if(this.reportData.length==0){
            this.comser.SnackBar_Nodata()
          } 
          this.dataSource.data=this.reportData;
          this.dataSource.paginator = this.paginator;
           this.dataSource.sort = this.sort;
          this.reportData.forEach(e => {
            this.tot_disb_amt += e.disb_amt
            this.tot_loan_balance += e.loan_balance
            this.tot_prn_recov += e.prn_recov
            this.tot_intt_recov+=e.intt_recov
            this.tot_subsidy_amt+=e.subsidy_amt
          });
          this.isLoading = false

      },err => {
        this.isLoading = false;
        this.comser.SnackBar_Error(); 
       })
      
      
    
      // this.apiUrl = this.reportcriteria.controls.OpenClose.value == 'C' ? 'Loan/PopulateLoanCloseRegister' : 'Loan/PopulateLoanOpenRegister'
      // this.svc.addUpdDel(this.apiUrl, dt).subscribe(data => {
      //   console.log(data)
      //   this.reportData = data;
        
      //   this.itemsPerPage = this.reportData.length % 50 <= 0 ? this.reportData.length : this.reportData.length % 50
      //   this.isLoading = false
      //   if(this.reportData.length<50){
      //     this.pagedItems=this.reportData
      //   }
      //   this.pageChange = document.getElementById('chngPage');
      //   this.pageChange.click()
      //   this.setPage(2);
      //   this.setPage(1)
      //   this.modalRef.hide();
      //   if (this.reportcriteria.controls.OpenClose.value == 'C') {
      //     this.reportData.forEach(e => {
      //       this.totSanc += e.sanc_amt
      //       this.totClsPrn += e.closing_amt
      //       this.totClsIntt += e.closing_intt
      //     });
      //   }
      //   else {
      //     this.reportData.forEach(e => {
      //       this.totSanc += e.sanc_amt
      //       this.totDisb += e.disb_amt
      //     });
      //   }
      // })
      this.showAlert = false;
    }
  }
  public closeAlert() {
    this.showAlert = false;
  }
  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedItems = this.reportData.slice(startItem, endItem);
    console.log(this.pagedItems)
    this.cd.detectChanges();
  }
  downloadexcel() {
    this.exportAsConfig = {
      type: 'xlsx',
      // elementId: 'hiddenTab', 
      elementIdOrContent:'trial11'
    }
    this.exportAsService.save(this.exportAsConfig, 'InterestSubsidy').subscribe(() => {
      // save started
      console.log("hello")
    });
  }
  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.getTotal()
  }

 
  getTotal(){
    this.tot_disb_amt = 0;
      this.tot_loan_balance = 0;
      this.tot_prn_recov = 0;
      this.tot_intt_recov = 0;
      this.tot_subsidy_amt = 0;
    console.log(this.dataSource.filteredData)
    this.filteredArray=this.dataSource.filteredData
    for(let i=0;i<this.filteredArray.length;i++){
            this.tot_disb_amt += this.filteredArray[i].disb_amt
            this.tot_loan_balance += this.filteredArray[i].loan_balance
            this.tot_prn_recov += this.filteredArray[i].prn_recov
            this.tot_intt_recov+=this.filteredArray[i].intt_recov
            this.tot_subsidy_amt+=this.filteredArray[i].subsidy_amt

    }
  }

}
