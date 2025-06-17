import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SystemValues, p_report_param, mm_customer } from 'src/app/bank-resolver/Models';
import { tt_trial_balance } from 'src/app/bank-resolver/Models/tt_trial_balance';
import { RestService } from 'src/app/_service';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as'
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';
interface AgentData {
  agent_id: string;
  agent_name: string;
  dd_deposit: number;
  dd_comm: number;
  fd_deposit: number;
  fd_comm: number;
  rd_deposit: number;
  rd_comm: number;
  bl_deposit: number;
  bl_comm: number;
  tot_deposit: number;
  tot_comm: number;
  tds: number;
  sec_dep: number;
  amt_paid: number;
}
@Component({
  selector: 'app-agent-commission',
  templateUrl: './agent-commission.component.html',
  styleUrls: ['./agent-commission.component.css'],
  providers:[ExportAsService]
})
export class AgentCommissionComponent implements OnInit {
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  dataSource = new MatTableDataSource<AgentData>([]);
  totalRow: any = {}; // Object to store totals
  displayedColumns: string[] = [
    'agent_id', 'agent_name', 'dd_deposit', 'dd_comm', 'fd_deposit', 'fd_comm',
    'rd_deposit', 'rd_comm', 'bl_deposit', 'bl_comm', 'tot_deposit',
    'tot_comm', 'tds', 'sec_dep', 'amt_paid'
  ];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;notvalidate:boolean=false;
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
  showAlert2 = false;
  isLoading = false;
  ReportUrl: SafeResourceUrl;
  UrlString = '';
  alertMsg = '';
  fd: any;
  td: any;
  dt: any;
  fromdate: Date;
  toDate: Date;
  counter=0
  afterPost:boolean=false;
  suggestedCustomer: mm_customer[];
  exportAsConfig:ExportAsConfig;
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData:any=[]
  ardbName=localStorage.getItem('ardb_name')
  branchName=this.sys.BranchName
  response:any;
  pageChange: any;
  total_comm=0;
  total_dep=0;
 
  lastAccCD:any;
  today:any
  
  filteredArray:any=[]
  agentTransactions:any[]=[];
  agentDetails :any[]=[];
  constructor(private svc: RestService, private formBuilder: FormBuilder,
    private modalService: BsModalService, private _domSanitizer: DomSanitizer,private exportAsService: ExportAsService, private cd: ChangeDetectorRef,
    private router: Router, private comser:CommonServiceService) { }
  ngOnInit(): void {
    this.getAgentList();
    this.fromdate = this.sys.CurrentDate;
    this.toDate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required]
    });
    
    var date = new Date();
    // get the date as a string
       var n = date.toDateString();
    // get the time as a string
       var time = date.toLocaleTimeString();
       this.today= n + " "+ time
       this.onLoadScreen(this.content);
  }
  onLoadScreen(content) {
    this.notvalidate=false
    this.modalRef = this.modalService.show(content, this.config);
  }
  isRetrieve(){
    this.onLoadScreen(this.content);
  }
  
  setPage(page: number) {
    this.currentPage = page;
    this.cd.detectChanges();
  }
  getAgentList() {
    var dt = {
      "ardb_cd": this.sys.ardbCD,
      "brn_cd": this.sys.BranchCode
    }
    this.svc.addUpdDel<any>('Deposit/GetAgentData', dt).subscribe(res => {
      this.agentDetails=res;
    })
  }
  mergeData() {
    const mergedData: AgentData[] = this.agentTransactions.map(txn => {
      const agent = this.agentDetails.find(a => a.agent_cd === txn.agent_id);
      return {
        agent_id: txn.agent_id,
        agent_name: agent ? agent.agent_name : 'Unknown',
        dd_deposit: txn.dd_deposit, dd_comm: txn.dd_comm,
        fd_deposit: txn.fd_deposit, fd_comm: txn.fd_comm,
        rd_deposit: txn.rd_deposit, rd_comm: txn.rd_comm,
        bl_deposit: txn.bl_deposit, bl_comm: txn.bl_comm,
        tot_deposit: txn.tot_deposit, tot_comm: txn.tot_comm,
        tds: txn.tds, sec_dep: txn.sec_dep, amt_paid: txn.amt_paid
      };
    });

    this.dataSource = new MatTableDataSource(mergedData);
    this.calculateGrandTotal(); // Calculate total row
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  calculateGrandTotal() {
    this.totalRow = {
      agent_id: 'Total',
      agent_name: '',
      dd_deposit: 0, dd_comm: 0, fd_deposit: 0, fd_comm: 0,
      rd_deposit: 0, rd_comm: 0, bl_deposit: 0, bl_comm: 0,
      tot_deposit: 0, tot_comm: 0, tds: 0, sec_dep: 0, amt_paid: 0
    };

    this.dataSource.data.forEach(row => {
      Object.keys(this.totalRow).forEach(key => {
        if (key !== 'agent_id' && key !== 'agent_name') {
          this.totalRow[key] += row[key as keyof AgentData] as number;
        }
      });
    });
  }
  public SubmitReport() {
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
      this.total_dep=0;
      this.total_comm=0;
      this.fromdate = this.reportcriteria.controls.fromDate.value;
      this.toDate = this.reportcriteria.controls.toDate.value;
      this.reportData.length=0;
      this.pagedItems.length=0;
      this.modalRef.hide();
      this.isLoading=true;
      var dt={
      "brn_cd": this.sys.BranchCode,
       "ardb_cd": this.sys.ardbCD,
       "from_dt" : this.fromdate.toISOString(),
       "to_dt" : this.toDate.toISOString(),
       "gs_user_id":this.sys.UserId
      }
      this.svc.addUpdDel<any>('Deposit/GetAgentComm',dt).subscribe(data=>{console.log(data)
        this.agentTransactions=data;
        this.isLoading=false;
        if(!this.agentTransactions){
          this.comser.SnackBar_Nodata();
        } 
        else{
          this.mergeData();
        }
        
        this.modalRef.hide();
        
        },
        err => {
           this.isLoading = false;
           this.comser.SnackBar_Error(); 
          })
        this.showAlert = false;
    }
  }
  public oniframeLoad(): void {
    this.counter++
    if(this.counter==2){
      this.isLoading=false;
      this.counter=0
    }
    else{
      this.isLoading = true;
  
    }
    this.modalRef.hide();
  }
  public closeAlert() {
    this.showAlert = false;
    this.showAlert2 = false;
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
      elementIdOrContent:'hiddenTab'
    }
    this.exportAsService.save(this.exportAsConfig, 'cashcumtrial').subscribe(() => {
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
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    this.calculateGrandTotal(); // Recalculate totals on filter change
  }
  getTotal(){
    this.total_dep=0;
    
    console.log(this.dataSource.filteredData)
    this.filteredArray=this.dataSource.filteredData
    for(let i=0;i<this.filteredArray.length;i++){
      this.total_dep+=this.filteredArray[i].deposited_amt;
      this.total_comm+=this.filteredArray[i].commission;

    }
  }
  
  Delete(){

  }
  PostIntt(){
    this.isLoading=true;
    var dt={
      "ardb_cd": this.sys.ardbCD,
      "brn_cd": this.sys.BranchCode,
      "adt_trans_dt":this.sys.CurrentDate.toISOString(),
      "gs_user_id": this.sys.UserId
     }
     debugger
     this.svc.addUpdDel('Deposit/PostAgentComm',dt).subscribe(res=>{console.log(res)
      this.response=res
       if(this.response==0){
        debugger
        this.isLoading=false
        this.showAlert2 = true
        this.afterPost=true;
        this.alertMsg = 'Commission Posting in Agent Account Successfully';
      }
      else{
        this.afterPost=false;
        this.showAlert = true
        this.alertMsg = 'Occurred in Commission Posting';
      }
       
       },
       err => {
          this.afterPost=false;
          this.isLoading = false;
          this.comser.SnackBar_Error(); 
         })
       
  }

}
