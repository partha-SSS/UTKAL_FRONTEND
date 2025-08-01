import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { SystemValues, mm_customer, p_report_param, mm_operation, mm_acc_type } from 'src/app/bank-resolver/Models';
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
interface DepositData {
  acc_type: string;
  total: { count: number; balance: number };
  [branch: string]: { count: number; balance: number } | any;
}
@Component({
  selector: 'app-loan-disb-sum-new-mem',
  templateUrl: './loan-disb-sum-new-mem.component.html',
  styleUrls: ['./loan-disb-sum-new-mem.component.css'],
  providers:[ExportAsService]
})
export class LoanDisbSumNewMemComponent implements OnInit {
  public static operations: mm_operation[] = [];
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
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
  resultLength=0
  filteredArray:any=[]
  AcctTypes:  mm_acc_type[] = [];
  prp = new p_report_param();
  reportcriteria: FormGroup;
  closeResult = '';
  showReport = false;
  showAlert = false;
  isLoading = true;
  ReportUrl: SafeResourceUrl;
  UrlString = '';
  alertMsg = '';
  counter=0;
  fd: any;
  td: any;
  dt: any;
  fromdate: Date;
  toDate: Date;
  exportAsConfig:ExportAsConfig;
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
  lastAccNum:any
  currInttSum=0
  ovdInttSum=0
  ovdPrnSum=0
  currPrnSum=0
  totOutStanding=0;
  totPenal=0
  bName=''
  selectedValue=''
  selectedValue1=''
  firstGroup:any=[]
  secondGroup:any=[]
  dummycurrInttSum=0
  dummyovdInttSum=0
  dummyovdPrnSum=0
  dummycurrPrnSum=0
  dummytotOutStanding=0;
  dummytotPenal=0
  loanNm:any;
  inputEl:any
  bName1=''
  filteredArray1:any=[]

  branches = ["HO: RAGHUNATHPUR", "Erasama", "Bilahata", "Kujanga", "Balikuda", "Krishnanandapur"];
  displayedColumns: string[] = ["acc_type", ...this.getBranchColumns(), "total_count", "total_amount"];
  headerRow: string[] = ["acc_type", ...this.branches, "total"];
  // subHeaderRow: string[] = ["acc_type", ...this.getBranchSubColumns(), "total_count", "total_amount"];
  tableData: any[]=[];
  dataSource = new MatTableDataSource()
  searchfilter= new MatTableDataSource()

  constructor(private svc: RestService, private formBuilder: FormBuilder,
    private modalService: BsModalService, private _domSanitizer: DomSanitizer,private exportAsService: ExportAsService, private cd: ChangeDetectorRef,
    private router: Router, private comser:CommonServiceService) { }
  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    // this.isLoading=true;
    this.fromdate = this.sys.CurrentDate;
    this.toDate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
      // acc_type_cd: [null, Validators.required]
    });
    // this.getAccountTypeList();
    this.onLoadScreen(this.content);
    var date = new Date();
    var n = date.toDateString();
    var time = date.toLocaleTimeString();
    this.today= n + " "+ time
  }
 onLoadScreen(content) {
    this.isLoading=false;
    this.modalRef = this.modalService.show(content, this.config);
  }
  // processData() {
  //   let groupedData: { [key: string]: DepositData } = {};

  //   // Grouping Data by Deposit Type
  //   this.reportData.forEach(entry => {
  //     if (!groupedData[entry.acc_type]) {
  //       groupedData[entry.acc_type] = { acc_type: entry.acc_type, total: { count: 0, balance: 0 } };
  //     }

  //     groupedData[entry.acc_type][entry.brn_name] = {
  //       count: entry.count,
  //       balance: entry.balance
  //     };

  //     groupedData[entry.acc_type].total.count += entry.count;
  //     groupedData[entry.acc_type].total.balance += entry.balance;
  //   });

  //   // Convert object to array
  //   this.tableData = Object.values(groupedData);
  //   console.log(this.tableData);
  //   console.log(JSON.stringify(this.tableData));
    
  // }
  processData() {
    let groupedData: { [key: string]: any } = {};
    let branchTotals: any = {
      acc_type: 'TOTAL',
      total: { count: 0, balance: 0 }
    };
  
    // Initialize branch totals
    this.branches.forEach(branch => {
      branchTotals[branch] = { count: 0, balance: 0 };
    });
  
    // Group and compute row totals
    this.reportData.forEach(entry => {
      if (!groupedData[entry.acc_type]) {
        groupedData[entry.acc_type] = {
          acc_type: entry.acc_type,
          total: { count: 0, balance: 0 }
        };
  
        // Initialize all branch entries for this acc_type
        this.branches.forEach(branch => {
          groupedData[entry.acc_type][branch] = { count: null, balance: null };
        });
      }
  
      groupedData[entry.acc_type][entry.brn_name] = {
        count: entry.count,
        balance: entry.balance
      };
  
      // Update acc_type totals
      groupedData[entry.acc_type].total.count += entry.count;
      groupedData[entry.acc_type].total.balance += entry.balance;
  
      // Update branch-wise totals
      if (branchTotals[entry.brn_name]) {
        branchTotals[entry.brn_name].count += entry.count;
        branchTotals[entry.brn_name].balance += entry.balance;
      }
  
      // Update overall total
      branchTotals.total.count += entry.count;
      branchTotals.total.balance += entry.balance;
      debugger
    });
  
    // Convert to array and push branch-wise total row
    this.tableData = Object.values(groupedData);
    console.log(branchTotals);
    
    this.tableData.push(branchTotals); // Add total row at the end
  }
  getBranchColumns(): string[] {
    let columns: string[] = [];
    this.branches.forEach(branch => {
      columns.push(branch, branch + "_count", branch + "_amount");
    });
    return columns;
  }

  getBranchSubColumns(): string[] {
    let columns: string[] = [];
    this.branches.forEach(branch => {
      columns.push(`${branch}_count`, `${branch}_amount`);
    });
    return columns;
  }

  setPage(page: number) {
    this.currentPage = page;
    this.cd.detectChanges();
  }

  getAccountTypeList() {

    if (this.AcctTypes.length > 0) {
      return;
    }
    this.AcctTypes = [];

    this.isLoading = true;
    this.svc.addUpdDel<any>('Mst/GetAccountTypeMaster', null).subscribe(
      res => {

        this.isLoading = false;
        this.AcctTypes = res;
        this.AcctTypes = this.AcctTypes.filter(c => c.dep_loan_flag === 'L');
        this.AcctTypes = this.AcctTypes.sort((a, b) => (a.acc_type_cd > b.acc_type_cd) ? 1 : -1);
      },
      err => {
        this.isLoading = false;
      }
    );
  }
  public SubmitReport() {
    if (this.reportcriteria.invalid) {
      this.showAlert = true;
      this.alertMsg = 'Invalid Input.';
      return false;
    }
    else {
      this.modalRef.hide();
      this.reportData.length=0;
      this.pagedItems.length=0;
      this.isLoading=true;
      this.fromdate = this.reportcriteria.controls.fromDate.value;
      this.toDate = this.reportcriteria.controls.toDate.value;
      var dt={
        "ardb_cd":this.sys.ardbCD,
        "brn_cd":this.sys.BranchCode,
        // "acc_cd":this.reportcriteria.controls.acc_type_cd.value,
        "from_dt":this.fromdate.toISOString(),
        "to_dt":this.toDate.toISOString()
      }
      this.svc.addUpdDel('Loan/PopulateBranchWiseLoanDisbSummaryNewMember',dt).subscribe(data=>{
        console.log(data)
        this.reportData=data
        this.isLoading=false
        // if(this.reportData.length<50){
        //   this.pagedItems=this.reportData
        // }
        if(this.reportData){
          this.processData()

        }
        else{
          this.comser.SnackBar_Nodata()

        }
      },err => {
        this.isLoading = false;
        this.comser.SnackBar_Error();
       })
    }
  }
  public oniframeLoad(): void {
    this.counter++;
    this.isLoading = true;
    // debugger
    if(this.counter==2){
      this.isLoading=false;
      this.counter=0;
    }
    // this.isLoading=false;
    this.modalRef.hide();
  }
  public closeAlert() {
    this.showAlert = false;
  }
  takeLoanVal(e:any){
    console.log(e)
  }
  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedItems = this.reportData.slice(startItem, endItem); //Retrieve items for page
    console.log(this.pagedItems)

    this.cd.detectChanges();
  }
  downloadexcel(){
    this.exportAsConfig = {
      type: 'xlsx',
      // elementId: 'hiddenTab',
      elementIdOrContent:'mattable'
    }
    this.exportAsService.save(this.exportAsConfig, 'Detail_List').subscribe(() => {
      // save started
      console.log("hello")
    });
  }
  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
  applyFilter0(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.searchfilter.data=this.dataSource.filteredData
    console.log(this.dataSource)
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.getTotal()
  }
  // applyFilter1(event: Event) {
  //   const filterValue = (event.target as HTMLInputElement).value;
  //   this.searchfilter.filter = filterValue.trim().toLowerCase();
  //   this.dataSource.data=this.searchfilter.filteredData
  //   if (this.dataSource.paginator) {
  //     this.dataSource.paginator.firstPage();
  //   }
  //   this.getTotal()
  // }
  applyFilter(event:Event){
    const filterValue=(event.target as HTMLInputElement).value
    this.bName=(event.target as HTMLInputElement).value
    this.filteredArray=this.dataSource.data
    // this.filteredArray=this.filteredArray.filter(e=>e.block_name.toLowerCase().includes(filterValue.toLowerCase())==true)
    switch(this.selectedValue1){
      case "Block":
      this.filteredArray=this.reportData.filter(e=>e.block_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
        break;
      case "Activity":
    this.filteredArray=this.reportData.filter(e=>e.acc_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
      break;
      case "Interest Upto":
      this.filteredArray=this.reportData.filter(e=>e.computed_till_dt?.toString().includes(filterValue)==true)
        break;
      case "Party Name":
    this.filteredArray=this.reportData.filter(e=>e.party_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
     break;
     case "Issue DT":
      this.filteredArray=this.reportData.filter(e=>e.list_dt?.toString().includes(filterValue)==true)
       break;
       case "Loan ID":
        this.filteredArray=this.reportData.filter(e=>e.acc_num?.toLowerCase().includes(filterValue.toLowerCase())==true)
         break;

    }
    this.dataSource.data=this.filteredArray
    this.getTotal()
    // this.filteredArray.forEach(e=>
    //   {
    //    if(e.block_name.includes(filterValue))
    // this.dataSource.data=this.filteredArray
    // console.log(this.dataSource.data)


    //   })
  }
  showFirstGroup(){
    this.dataSource.data=this.reportData
    this.bName=''
    this.bName1=''
    this.selectedValue=''
    this.firstGroup.length=0
    switch(this.selectedValue1){
     case "Block":
      for(let i=0;i<this.reportData.length;i++){
        this.firstGroup[i]=this.reportData[i].block_name
     }
      //  console.log(this.blockNames)

        break;
      case "Activity":
      for(let i=0;i<this.reportData.length;i++){
        this.firstGroup[i]=this.reportData[i].acc_name
     }
    // this.filteredArray=this.reportData.filter(e=>e.activity_cd?.toLowerCase().includes(filterValue.toLowerCase())==true)
      break;
      case "Party Name":
        for(let i=0;i<this.reportData.length;i++){
          this.firstGroup[i]=this.reportData[i].party_name
       }
    // this.filteredArray=this.reportData.filter(e=>e.party_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
     break;
     case "Interest Upto":
      for(let i=0;i<this.reportData.length;i++){
        this.firstGroup[i]=this.reportData[i].computed_till_dt
     }
      // this.filteredArray=this.reportData.filter(e=>e.vill_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
       break;
       case "Loan ID":
        for(let i=0;i<this.reportData.length;i++){
          this.firstGroup[i]=this.reportData[i].acc_num
       }
        // this.filteredArray=this.reportData.filter(e=>e.loan_id?.toLowerCase().includes(filterValue.toLowerCase())==true)
         break;
         case "Issue DT":
          for(let i=0;i<this.reportData.length;i++){
            this.firstGroup[i]=this.reportData[i].list_dt
         }
          // this.filteredArray=this.reportData.filter(e=>e.loan_id?.toLowerCase().includes(filterValue.toLowerCase())==true)
           break;

    }
    this.firstGroup=Array.from(new Set(this.firstGroup))
    this.firstGroup=this.firstGroup.sort()
  }
  searchFirstGroup(){
    this.isLoading=true
    // this.bName=''
    this.bName1=''
    this.selectedValue=''
    setTimeout(()=>{this.isLoading=false},500)
    switch(this.selectedValue1){
      case "Block":
      this.filteredArray=this.reportData.filter(e=>e.block_name?.toLowerCase().includes(this.bName.toLowerCase())==true)
        break;
      case "Activity":
    this.filteredArray=this.reportData.filter(e=>e.acc_name?.toLowerCase().includes(this.bName.toLowerCase())==true)
      break;
      case "Party Name":
    this.filteredArray=this.reportData.filter(e=>e.party_name?.toLowerCase().includes(this.bName.toLowerCase())==true)
     break;
     case "Interest Upto":
      this.filteredArray=this.reportData.filter(e=>e.computed_till_dt.includes(this.bName)==true)
       break;
       case "Issue DT":
        this.filteredArray=this.reportData.filter(e=>e.list_dt.includes(this.bName)==true)
         break;
       case "Loan ID":
        this.filteredArray=this.reportData.filter(e=>e.acc_num?.toLowerCase().includes(this.bName.toLowerCase())==true)
         break;

    }
    this.dataSource.data=this.filteredArray
    this.filteredArray1=this.filteredArray
    this.getTotal()
  }
  showSecondGroup(){
    this.dataSource.data=this.filteredArray1
    this.secondGroup.length=0;
    this.bName1=''
    switch(this.selectedValue){
       case "Block":
      for(let i=0;i<this.filteredArray1.length;i++){
        this.secondGroup[i]=this.filteredArray1[i].block_name
     }
      //  console.log(this.blockNames)

        break;
      case "Activity":
      for(let i=0;i<this.filteredArray1.length;i++){
        this.secondGroup[i]=this.filteredArray1[i].acc_name
     }
    // this.filteredArray=this.reportData.filter(e=>e.activity_cd?.toLowerCase().includes(filterValue.toLowerCase())==true)
      break;
      case "Party Name":
        for(let i=0;i<this.filteredArray1.length;i++){
          this.secondGroup[i]=this.filteredArray1[i].party_name
       }
    // this.filteredArray=this.reportData.filter(e=>e.party_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
     break;
     case "Interest Upto":
      for(let i=0;i<this.filteredArray1.length;i++){
        this.secondGroup[i]=this.filteredArray1[i].computed_till_dt
     }
      // this.filteredArray=this.reportData.filter(e=>e.vill_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
       break;
       case "Loan ID":
        for(let i=0;i<this.filteredArray1.length;i++){
          this.secondGroup[i]=this.filteredArray1[i].acc_num
       }
        // this.filteredArray=this.reportData.filter(e=>e.loan_id?.toLowerCase().includes(filterValue.toLowerCase())==true)
         break;
         case "Issue DT":
          for(let i=0;i<this.filteredArray1.length;i++){
            this.secondGroup[i]=this.filteredArray1[i].list_dt
         }
          // this.filteredArray=this.reportData.filter(e=>e.loan_id?.toLowerCase().includes(filterValue.toLowerCase())==true)
           break;

    }
    this.secondGroup=Array.from(new Set(this.secondGroup))
    this.secondGroup=this.secondGroup.sort()
    this.getTotal()
  }
  searchSecondGroup(){
    this.isLoading=true
    setTimeout(()=>{this.isLoading=false},500)
    console.log(this.filteredArray1)
debugger
    switch(this.selectedValue){
      case "Block":
      this.filteredArray=this.filteredArray1.filter(e=>e.block_name?.toLowerCase().includes(this.bName1.toLowerCase())==true)
        break;
      case "Activity":
    this.filteredArray=this.filteredArray1.filter(e=>e.acc_name?.toLowerCase().includes(this.bName1.toLowerCase())==true)
      break;
      case "Party Name":
    this.filteredArray=this.filteredArray1.filter(e=>e.party_name?.toLowerCase().includes(this.bName1.toLowerCase())==true)
     break;
     case "Interest Upto":
      this.filteredArray=this.filteredArray1.filter(e=>e.computed_till_dt.includes(this.bName1)==true)
       break;
       case "Issue DT":
        this.filteredArray=this.filteredArray1.filter(e=>e.list_dt.includes(this.bName1)==true)
         break;
       case "Loan ID":
        this.filteredArray=this.filteredArray1.filter(e=>e.acc_num?.toLowerCase().includes(this.bName1.toLowerCase())==true)
         break;

    }
    debugger;
    console.log(this.filteredArray1)
    this.dataSource.data=this.filteredArray
    this.getTotal()
  }
  applyFilter1(event:Event){
    const filterValue=(event.target as HTMLInputElement).value
    this.filteredArray=this.dataSource.data
    switch(this.selectedValue){
      case "Activity":
    this.filteredArray=this.filteredArray.filter(e=>e.acc_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
      break;
      case "Interest Upto":
      this.filteredArray=this.filteredArray.filter(e=>e.computed_till_dt?.toString().includes(filterValue)==true)
        break;
      case "Party Name":
    this.filteredArray=this.filteredArray.filter(e=>e.party_name?.toLowerCase().includes(filterValue.toLowerCase())==true)
     break;
     case "Issue DT":
      this.filteredArray=this.filteredArray.filter(e=>e.list_dt?.toString().includes(filterValue)==true)
       break;
       case "Loan ID":
        this.filteredArray=this.filteredArray.filter(e=>e.acc_num?.toLowerCase().includes(filterValue.toLowerCase())==true)
         break;

    }
    this.dataSource.data=this.filteredArray

    this.getTotal()
  }
  getTotal(){

      this.ovdInttSum=0
      this.currInttSum=0
      this.currPrnSum=0
      this.ovdPrnSum=0
      this.totOutStanding=0
      this.totPenal=0

    console.log(this.dataSource.filteredData)
    this.filteredArray=this.dataSource.filteredData
    this.filteredArray.forEach(e => {
      this.ovdInttSum+=e.ovd_intt
      this.currInttSum+=e.curr_intt
      this.currPrnSum+=e.curr_prn
      this.ovdPrnSum+=e.ovd_prn
      this.totOutStanding+=e.ovd_prn+e.curr_prn
      this.totPenal+=e.penal_intt
    });
  }
  resetList(){
    this.isLoading=true
    setTimeout(()=>{this.isLoading=false},500)
    this.dataSource.data=this.reportData;
    // this.SubmitReport()
    this.inputEl=document.getElementById('myInput');
    this.inputEl.value=''
    // this.inputEl=document.getElementById('myInput2');
    // this.inputEl.value=''
    // this.inputEl=document.getElementById('myInput1');
    this.inputEl.value=''
    this.ovdInttSum=this.dummyovdInttSum
    this.currInttSum=this.dummycurrInttSum
    this.currPrnSum=this.dummycurrPrnSum
    this.ovdPrnSum=this.dummyovdPrnSum
   this.totOutStanding=this.dummytotOutStanding
   this.totPenal=this.dummytotPenal
   this.selectedValue='';
   this.selectedValue1='';
   this.bName=''
   this.bName1=''


  }
}
