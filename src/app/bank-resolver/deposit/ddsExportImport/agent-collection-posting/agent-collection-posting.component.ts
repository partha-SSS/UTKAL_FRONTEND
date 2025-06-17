import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup} from '@angular/forms';
import { Router } from '@angular/router';
import { tm_subsidy } from 'src/app/bank-resolver/Models/loan/tm_subsidy';
import { RestService } from 'src/app/_service';
import { LOGIN_MASTER, MessageType, mm_customer, ShowMessage, SystemValues } from '../../../Models';
import { m_branch } from '../../../Models/m_branch';
import { DatePipe } from '@angular/common'
import { environment } from 'src/environments/environment';
import { p_gen_param } from 'src/app/bank-resolver/Models/p_gen_param';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
interface DataItem {
  account_type: string;
  deposit_amount: number;
  product_code:string;
  account_holder_name:string;
}
@Component({
  selector: 'app-agent-collection-posting',
  templateUrl: './agent-collection-posting.component.html',
  styleUrls: ['./agent-collection-posting.component.css'],
  providers: [DatePipe]
})
export class AgentCollectionPostingComponent implements OnInit {
  brnDtls: m_branch[] = [];
  modalRef: BsModalRef;
  showHideAgent:boolean=false
  isLoading = false;
  agentFrm: FormGroup;
  showMsg: ShowMessage;
  isDel = false;
  isRetrieve = false;
  isNew = false;
  isModify = false;
  isSave = true;
  // isSave = false;
  isClear = false;
  isOpenFromDp = false;
  isOpenFromDp1 = false;
  sys = new SystemValues();
  subsidyData: any;
  suggestedCustomer: mm_customer[];
  shownoresult = false;
  disabledOnNull = true;
  editDeleteMode = false;
  isApprove = false;
  custName:any=[];
  // agentData: { ardb_cd: string; brn_cd: string; };
  agentData: any;
  agentRes:any;
  allAgent:any;
  retrieveAgentData:any;
  transData:any;
  totSum=0;
  totAmt=0;
  k=0;
  groupedData: any[] = [];
  overallTotal: number = 0;
  changedAccounts: any[] = [];
  constructor(public datepipe: DatePipe,private modalService: BsModalService, private router: Router, private formBuilder: FormBuilder, private svc: RestService) { }
  disTransBtn = true;
  ngOnInit(): void {
    this.getSubsidyType()
    this.getAgentList()
    this.agentFrm = this.formBuilder.group({
      trans_cd: [''],
      trans_dt: [''],
      agent_cd: [''],
      agent_name: [''],
      trans_amt: [''],
      trans_type: ['']
    });
    this.isDel = false;
    this.agentFrm.controls.agent_cd.disable()
    this.agentFrm.controls.trans_dt.disable()
    this.agentFrm.disable()
    this.isRetrieve = true;
    this.isNew = true;
    this.isModify = false;
    this.isSave = false;
    this.isClear = true;
    this.editDeleteMode = false
    this.agentFrm.controls.trans_dt.setValue(this.sys.CurrentDate)
    this.agentFrm.controls.agent_cd.enable();

  }
  get f() { return this.agentFrm.controls; }
  closeScreen() {
    this.router.navigate([localStorage.getItem('__bName') + '/la']);
  }
  getSubsidyType() {
    this.svc.getlbr(environment.subsidyUrl, null).subscribe(data => {
      this.subsidyData = data
    })
  }
  new() {
    this.isDel = false;
    this.isRetrieve = false;
    this.isNew = false;
    this.isModify = false;
    this.isSave = true;
    this.isClear = true;
    this.editDeleteMode = false;
    this.GetBranchMaster();
  }
  GetBranchMaster() {
    this.isLoading = true;
    ;
    this.svc.addUpdDel('Mst/GetBranchMaster', null).subscribe(
      res => {
        ;
        this.brnDtls = res;
        this.isLoading = false;

      },
      err => { this.isLoading = false;; }
    )
  }
  retrieve() {
    this.agentFrm.controls.agent_cd.enable();
    this.isSave=false;
  }
  getAgentList() {
    var dt = {
      "ardb_cd": this.sys.ardbCD,
      "brn_cd": this.sys.BranchCode
    }
    this.svc.addUpdDel('Deposit/GetAgentData', dt).subscribe(res => {
      this.agentRes=res
      this.allAgent=res
    })
  }
  saveuser() {
    this.isLoading=true;
      this.svc.addUpdDel('Deposit/UpdateUnapprovedDailyDeposit',this.changedAccounts).subscribe(d1=>{
       if(!d1){
          this.HandleMessage(true,MessageType.Sucess,'Updated successfully!!')
          this.isLoading=false;

        }
        else{
          this.isLoading=false;
          this.HandleMessage(true,MessageType.Error,'An Error occurred while updating!!')
        }
         
      },error=>{
        console.log(error);
        this.isLoading=false;
        this.HandleMessage(true,MessageType.Error,'An Error occurred while updating!!')
      }

      )
    
  }
 deleteuser() {
    this.isLoading = true;
    let subsidyEntry = new tm_subsidy();
    subsidyEntry.brn_cd = this.sys.BranchCode;
    subsidyEntry.loan_id = this.f.loan_id.value;
    subsidyEntry.ardb_cd = this.sys.ardbCD;
    this.svc.addUpdDel('Loan/DeleteSubsidyData', subsidyEntry).subscribe(
      res => {
        console.log(res)
        this.isLoading = false;
        this.HandleMessage(true, MessageType.Sucess, 'Subsidy Entry successfully deleted!');
        this.initialize();
        this.isDel = false;
        this.isRetrieve = true;
        this.isNew = true;
        this.isModify = false;
        this.isSave = false;
        this.isClear = true;
        this.editDeleteMode = false
      },
      err => {
        this.isLoading = false; this.HandleMessage(true, MessageType.Error, 'Deletion Failed!!');
        this.initialize();
        this.isDel = false;
        this.isRetrieve = true;
        this.isNew = true;
        this.isModify = false;
        this.isSave = false;
        this.isClear = true;
        this.editDeleteMode = false
      }
    )
  }
  clearuser() {
    this.initialize();
    this.isDel = false;
    this.isRetrieve = true;
    this.isNew = true;
    this.isModify = false;
    this.isSave = false;
    this.isClear = true;
    this.editDeleteMode = false
    this.agentFrm.reset();
    this.agentFrm.disable();
    this.disTransBtn=true;
    this.isApprove=false

    this.transData=null
    this.agentFrm.controls.trans_dt.setValue(this.sys.CurrentDate);
    this.changedAccounts=[];
    this.groupedData=[];
  }
  selectAgent(agent:any){
    this.agentFrm.controls.agent_cd.setValue(agent.agent_cd);
    this.agentFrm.controls.agent_name.setValue(agent.agent_name);
    this.showHideAgent=false
    debugger;
    this.retrieveData();
  }
  scrollToBotom(){
    window.scrollTo({  top:document.body.scrollHeight, behavior: 'smooth' }); // Smooth scroll to top

  }
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Smooth scroll to top
  }
  retrieveData(){
    this.custName=[];
    this.isLoading=true;
    this.k=0
    console.log(this.f.trans_dt.value+" "+this.f.agent_cd.value);
    this.totSum=0;
    this.totAmt=0
    var dt = {
      "ardb_cd":this.sys.ardbCD,
      "branch_code":this.sys.BranchCode,
      "agent_code":this.f.agent_cd.value,
      "transaction_date":this.f.trans_dt.value
    }
    if(this.f.agent_cd.value){
    this.svc.addUpdDel('Deposit/GetAgentCollection',dt).subscribe((dat:any) => {console.log(dat)
      this.groupData(dat)
      console.log(this.groupedData);
      this.isLoading=false;
      this.isApprove=true

    })
     
    }
    else{
      this.isLoading=false;
      this.isApprove=false
      this.clearuser();
      this.agentFrm.controls.agent_cd.enable()
    }
  }
  groupData(data) {
    const groupMap = new Map<string, any>();
    data.forEach(item => {
      if (!groupMap.has(item.product_code)) {
        groupMap.set(item.product_code, {
          account_type: item.account_type,
          product_code: item.product_code,
          accounts: [],
          total: 0
        });
      }
      const group = groupMap.get(item.product_code);
      group.accounts.push(item);
      group.total += item.deposit_amount;
    });

    this.groupedData = Array.from(groupMap.values());
    this.calculateOverallTotal();
  }

  // Calculate overall total
  calculateOverallTotal() {
    this.overallTotal = this.groupedData.reduce((sum, group) => sum + group.total, 0);
    this.agentFrm.controls.trans_amt.setValue(this.overallTotal)

  }

  // Recalculate group and overall totals on deposit_amount change
  calcSum() {
    this.changedAccounts = []; // Clear previous changes

    this.groupedData.forEach(group => {
      group.total = group.accounts.reduce((sum: number, account: any) => sum + account.deposit_amount, 0);

      group.accounts.forEach(account => {
        // Check if deposit_amount has changed
        if (account.deposit_amount !== account.original_amount) {
          // Add the object to changedAccounts if it has changed
          const updatedAccount = { ...account }; // Clone the object to avoid mutation
          delete updatedAccount.original_amount; // Remove unnecessary property
          this.changedAccounts.push(updatedAccount);
        }
      });
    });

    this.calculateOverallTotal();
    console.log('Changed Accounts:', this.changedAccounts); // Debug: log only changed accounts
  }

  initialize() {
    this.agentFrm.reset()
  }
  
  clearSuggestedCust() {
    this.suggestedCustomer = null;
    this.shownoresult = false
    if (this.f.loan_id.value.length > 0) {
      this.disabledOnNull = false
    }
    else {
      this.disabledOnNull = true;
    }
  }
  SelectCustomer(cust) {
    console.log(cust);
    this.suggestedCustomer = [];
    this.f.loan_id.setValue(cust.loan_id)
    this.isSave = false;
    this.retrieve()
  }
  public suggestCustomer(): void {
    this.isLoading = true;
    if (this.f.loan_id.value.length > 0) {
      const prm = new p_gen_param();
      prm.ad_acc_type_cd = 20411;
      prm.as_cust_name = this.f.loan_id.value.toLowerCase();
      this.svc.addUpdDel<any>('Loan/GetLoanDtls', prm).subscribe(
        res => {
          console.log(res)
          this.isLoading = false;
          if (undefined !== res && null !== res && res.length > 0) {

            this.suggestedCustomer = res;
          } else {
            this.shownoresult = true;
            this.suggestedCustomer = [];
          }
        },
        err => {
          this.shownoresult = false;
          this.isLoading = false;
        }
      );
    } else {
      this.suggestedCustomer = null;
    }
  }
  private HandleMessage(show: boolean, type: MessageType = null, message: string = null) {
    this.showMsg = new ShowMessage();
    this.showMsg.Show = show;
    this.showMsg.Type = type;
    this.showMsg.Message = message;
  }
  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, { class: 'modal-lg' });
  }
  approve(){
    this.modalRef.hide();
    this.isLoading=true;
    var dt={
      "ardb_cd":this.sys.ardbCD,
      "brn_cd":this.sys.BranchCode,
      "trans_dt":this.f.trans_dt.value,
      "user_id":this.sys.UserId,
      "agent_cd":this.f.agent_cd.value
    }
    this.svc.addUpdDel('Deposit/ApproveDDSData',dt).subscribe(data=>{console.log(data)
      
    if(!data){
      this.HandleMessage(true, MessageType.Sucess, 'Approved successfully');
      this.isApprove=false
      this.isLoading=false;
    }
    else{
      this.isApprove=true
      this.HandleMessage(true, MessageType.Error, 'Error while approving');
      this.isLoading=false;
    }
    },error=>{this.HandleMessage(true, MessageType.Error, 'Error while approving')
      this.isApprove=true
      this.isLoading=false;
   })
  }
  onshow(i:any)
  {
    if(i.target.value==''){
      this.showHideAgent=false
    }
    else{
      this.agentRes=this.allAgent.filter(e=>e.agent_name.toLowerCase().includes(i.target.value.toLowerCase()) || e.agent_cd.includes(i.target.value.toLowerCase()) ==true)
      this.showHideAgent=true
    }
    debugger
    }
}
