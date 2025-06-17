import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, TemplateRef, ViewChild, Renderer2 } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SystemValues, p_report_param, mm_customer } from 'src/app/bank-resolver/Models';
import { RestService } from 'src/app/_service';
import { PageChangedEvent } from "ngx-bootstrap/pagination/public_api";
import { ExportAsService, ExportAsConfig } from 'ngx-export-as'
import html2canvas from 'html2canvas';  
import html2pdf from 'html2pdf.js';
import jspdf from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MatTableDataSource } from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { CommonServiceService } from 'src/app/bank-resolver/common-service.service';

export interface PeriodicElement {
  name: any;
  position: any;
  weight: any;
  symbol: any;
}
interface Membership {
  brn_name: string;
  sc: number;
  st: number;
  obc: number;
  gen: number;
  tot: number;
  women: number;
}
const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O'},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F'},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne'},
];
@Component({
  selector: 'app-member-list-with-share',
  templateUrl: './member-list-with-share.component.html',
  styleUrls: ['./member-list-with-share.component.css']
})
export class MemberListWithShareComponent implements OnInit {
  @ViewChild('content', { static: true }) content: TemplateRef<any>;
  @ViewChild('content1', { static: true }) content1: ElementRef<any>;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatTable, {read: ElementRef} ) private matTableRef: ElementRef;

  modalRef: BsModalRef;
  isOpenFromDp = false;
  isOpenToDp = false;
  sys = new SystemValues();
  config = {
    keyboard: false, // ensure esc press doesnt close the modal
    backdrop: true, // enable backdrop shaded color
    ignoreBackdropClick: true // disable backdrop click to close the modal
  };
  reportcriteria: FormGroup;
  closeResult = '';
  showReport = false;
  showAlert = false;
  isLoading = false;
  alertMsg = '';
  exportAsConfig:ExportAsConfig;
  itemsPerPage = 50;
  currentPage = 1;
  pagedItems = [];
  reportData:any=[]
  ardbName=localStorage.getItem('ardb_name')
  branchName=this.sys.BranchName
  pageChange: any;
  today:any;
  fromdate: Date;
  resultLength=0
  pressed = false;
  currentResizeIndex: number;
  startX: number;
  startWidth: number;
  isResizingRight: boolean;
  asOnDate:string;
   tot_gen:number=0
   tot_obc:number=0
   tot_sc:number=0
   tot_st:number=0
   tot_tot:number=0
   tot_women:number=0
  resizableMousemove: () => void;
  resizableMouseup: () => void;
  columns: any[] = [
    { field: 'UCIC', width: 20,  },
    { field: 'Name', width: 20, },
    { field: 'Guardian_Name', width: 20, },
    { field: 'Address', width: 20, },
    { field: 'Phone', width: 20, },
    { field: 'Gender', width: 20, },
    { field: 'Caste', width: 20, },
    { field: 'Community', width: 20, },
    { field: 'Category', width: 20, },
  ];
  displayedColumns: string[] = ['brn_name', 'sc', 'st', 'obc', 'gen', 'tot', 'women'];
  dataSource = new MatTableDataSource()


  rawData: any[] = [];       // Full API response
  tableData: any[] = [];     // Transformed for table
  filteredData: any[] = [];
  headers: string[] = [];
  filterText: string = '';
  totalShareBalance: number = 0;
  constructor(private svc: RestService, 
    private formBuilder: FormBuilder,
    private exportAsService: ExportAsService, 
    private cd: ChangeDetectorRef, private comser:CommonServiceService,
    private modalService: BsModalService,  private renderer: Renderer2,private _domSanitizer: DomSanitizer, private router: Router) { }
  ngOnInit(): void {
    this.fromdate = this.sys.CurrentDate;
    this.reportcriteria = this.formBuilder.group({
      fromDate: [null, Validators.required]
    });
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.onLoadScreen(this.content);
    // this.SubmitReport()
    var date = new Date();
    var n = date.toDateString();
    var time = date.toLocaleTimeString();
    this.today= n + " "+ time;
    // this.SubmitReport();
  }
  setPage(page: number) {
    this.currentPage = page;
    this.cd.detectChanges();
  }
  onLoadScreen(content) {
  
    this.modalRef = this.modalService.show(content, this.config);
  }
  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedItems = this.reportData.slice(startItem, endItem); //Retrieve items for page
    this.cd.detectChanges();
  }
  formatDate(date: Date): string {
    // Get the day, month, and year
    const day = date.getDate();
    const month = date.getMonth() + 1; // Month starts from 0
    const year = date.getFullYear();

    // Pad single digit day and month with zero
    const formattedDay = day < 10 ? '0' + day : day;
    const formattedMonth = month < 10 ? '0' + month : month;

    // Format the date as dd/mm/yyyy
    return `${formattedDay}/${formattedMonth}/${year}`;
}
  public SubmitReport() {
    // const inputDateString = this.fromdate;
    const inputDate = this.reportcriteria.controls.fromDate.value;
    const formattedDate = this.formatDate(inputDate);
    this.asOnDate=formattedDate
    console.log(formattedDate);
    this.modalRef.hide();
    this.fromdate = this.reportcriteria.controls.fromDate.value;
    var dt={
      "from_dt": this.fromdate.toISOString(),
        "ardb_cd":this.sys.ardbCD,
        "brn_cd":this.sys.BranchCode
    }
      this.isLoading=true
      this.showAlert = false;
      this.svc.addUpdDel<any>('UCIC/GetMemberList',dt).subscribe(data=>{
        console.log(data)
        this.rawData = data 
        if(!this.rawData){
          this.comser.SnackBar_Nodata()
        } 
        else{
          const headerRow = this.rawData.find(row => row.index_value === 0)?.string_data.split('|') || [];
    const dataRows = this.rawData.filter(row => row.index_value > 0)
      .map(row => row.string_data.split('|'));

    this.tableData = dataRows.map(row => {
      const obj: any = {};
      headerRow.forEach((h, i) => obj[h.trim()] = row[i]?.trim() ?? '');
      return obj;
    });
    console.log(dataRows);
    console.log(headerRow);
    console.log(this.tableData);

    this.headers = headerRow;
    this.filteredData = [...this.tableData];
    this.calculateTotal();
        
        }
        this.isLoading=false
      },
      err => {
         this.isLoading = false;
         this.comser.SnackBar_Error(); 
        }
)
    }
    public closeAlert() {
    this.showAlert = false;
  }
   filterTable(): void {
    console.log(this.tableData);
    
    const search = this.filterText.toLowerCase();
    this.filteredData = this.tableData.filter(row =>
      Object.values(row).some((val:any) =>
        val?.toLowerCase().includes(search)
      )
    );
    this.calculateTotal();
  }

  calculateTotal(): void {
    this.totalShareBalance = this.filteredData.reduce((sum, row) => {
      const val = parseFloat(row['SHARE BALANCE'] || '0');
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }
  closeScreen() {
    this.router.navigate([this.sys.BankName + '/la']);
  }
  public downloadPDF() {
  // var element = document.getElementById('hiddenTab');
  // console.log(element)
  // var option = {
  // margin:       0,
  // filename:     'MemberList.pdf',
  // image:        { type: 'jpeg', quality: 0.98 },
  // html2canvas:  { scale:1},
  // jsPDF:        { unit: 'mm', format: 'a4', orientation: 'p' }
  // };
  // html2pdf()
  //        .from(element)
  //        .set(option)
  //        .save()

  var data = document.getElementById('hiddenTab');
  html2canvas(data).then(canvas => {
    var imgWidth = 208;
    var imgHeight = canvas.height * imgWidth / canvas.width;
    const contentDataURL = canvas.toDataURL('image/png')
    let pdf = new jspdf('p', 'mm', 'a4');
    var position = 0;
    pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight)
    pdf.save('newPDF.pdf');
  });

  

  // const doc = new jsPDF();

  // const specialElementHandlers = {
  //   '#editor': function (element, renderer) {
  //     return true;
  //   }
  // };

  // const content = this.content1.nativeElement;

  // doc.fromHTML(content.innerHTML, 1000, 1000, {
  //   width: 190,
  //   'elementHandlers': specialElementHandlers
  // });
  // doc.save('test.pdf');
}
applyFilter(event: Event) {
  console.log(event)
  const filterValue = (event.target as HTMLInputElement).value;
  this.dataSource.filter = filterValue.trim().toLowerCase();
  if (this.dataSource.paginator) {
    this.dataSource.paginator.firstPage();
  }
}
setTableResize(tableWidth: number) {
  let totWidth = 0;
  this.columns.forEach(( column) => {
    totWidth += column.width;
  });
  const scale = (tableWidth - 5) / totWidth;
  this.columns.forEach(( column) => {
    column.width *= scale;
    this.setColumnWidth(column);
  });
}

setDisplayedColumns() {
  this.columns.forEach(( column, index) => {
    column.index = index;
    this.displayedColumns[index] = column.field;
  });
}

onResizeColumn(event: any, index: number) {
  console.log(event.target.parentElement);
  this.checkResizing(event, index);
  this.currentResizeIndex = index;
  this.pressed = true;
  this.startX = event.pageX;
  this.startWidth = event.target.parentElement.clientWidth;
  event.preventDefault();
  this.mouseMove(index);
}

private checkResizing(event, index) {
  const cellData = this.getCellData(index);
  if ( ( index === 0 ) || ( Math.abs(event.pageX - cellData.right) < cellData.width / 2 &&  index !== this.columns.length - 1 ) ) {
    this.isResizingRight = true;
  } else {
    this.isResizingRight = false;
  }
}

private getCellData(index: number) {
  const headerRow = this.matTableRef.nativeElement.children[0].querySelector('tr');
  const cell = headerRow.children[index];
  return cell.getBoundingClientRect();
}

mouseMove(index: number) {
  this.resizableMousemove = this.renderer.listen('document', 'mousemove', (event) => {
    if (this.pressed && event.buttons ) {
      const dx = (this.isResizingRight) ? (event.pageX - this.startX) : (-event.pageX + this.startX);
      const width = this.startWidth + dx;
      if ( this.currentResizeIndex === index && width > 50 ) {
        this.setColumnWidthChanges(index, width);
      }
    }
  });
  this.resizableMouseup = this.renderer.listen('document', 'mouseup', (event) => {
    if (this.pressed) {
      this.pressed = false;
      this.currentResizeIndex = -1;
      this.resizableMousemove();
      this.resizableMouseup();
    }
  });
}

setColumnWidthChanges(index: number, width: number) {
  const orgWidth = this.columns[index].width;
  const dx = width - orgWidth;
  if ( dx !== 0 ) {
    const j = ( this.isResizingRight ) ? index + 1 : index - 1;
    const newWidth = this.columns[j].width - dx;
    if ( newWidth > 50 ) {
        this.columns[index].width = width;
        this.setColumnWidth(this.columns[index]);
        this.columns[j].width = newWidth;
        this.setColumnWidth(this.columns[j]);
      }
  }
}
downloadexcel(){
  this.exportAsConfig = {
    type: 'csv',
    // elementId: 'hiddenTab', 
    elementIdOrContent:'mattable'
  }
  this.exportAsService.save(this.exportAsConfig, 'MemberList').subscribe(() => {
    // save started
    console.log("hello")
  });
}
generatePdfUsingAutoTable2() {
  const doc = new jspdf('l', 'pt', 'a4'); // 'l' for landscape, 'pt' for points

  // Define columns from your headers
  const head = [this.headers];

  // Prepare rows
  const body = this.filteredData.map(row =>
    this.headers.map(header => row[header] || '')
  );

  autoTable(doc, {
    head: head,
    body: body,
    startY: 20,
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    margin: { top: 30 },
    didDrawPage: function (data) {
      doc.setFontSize(12);
      doc.text('Member List With Share', data.settings.margin.left, 10);
    }
  });

  doc.save('members-table.pdf');
}


generatePdfUsingAutoTable3() {
  const doc = new jspdf('l', 'pt', 'a4'); // Landscape A4

  // Get current date and time
  const now = new Date();
  const runDateTime = now.toString()
  const dateOnly = now.toLocaleDateString('en-GB').replace(/\//g, '/'); // dd/mm/yyyy

  // Main Header Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('UTKAL FINANCIAL CO-OPERATIVE SOCIETY LIMITED (HO: RAGHUNATHPUR)', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Run Date & Time : ${runDateTime}`, doc.internal.pageSize.getWidth() / 2, 50, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Member List With Share As on ${dateOnly}`, doc.internal.pageSize.getWidth() / 2, 70, { align: 'center' });
 // Table headers
  const headers = [
    "SERIAL", "MEMBER ID", "MEMBER NAME", "GUARDIAN NAME", "PRESENT ADDRESS",
    "PHONE", "MEMBERSHIP DATE", "SHARE COUNT", "SHARE BALANCE",
    "NOMINEE NAME", "NOMINEE ADDRESS"
  ];

  // Body (replace with this.filteredData.map...)
  const data = this.filteredData.map(row =>
    headers.map(header => row[header] || '')
  );

  // Total share balance calculation
  const totalShareBalance = this.filteredData.reduce((sum, row) => sum + (parseFloat(row["SHARE BALANCE"]) || 0), 0);

  // Define headers

const foot:any[] = [
    [
      { content: 'Total SHARE BALANCE:', colSpan: headers.length - 3, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: String(totalShareBalance), styles: { fontStyle: 'bold' } },
      '', ''
    ]]
  // Table with custom styling
  autoTable(doc, {
    startY: 90,
    head: [headers],
    body: data,
    foot: foot,
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    columnStyles: {
      1: { cellWidth: 100 }, // MEMBER ID
      5: { cellWidth: 100 }  // PHONE
    },
    headStyles: { fillColor: [41, 128, 185] },
    theme: 'striped',
  });

  doc.save('members-table.pdf');
}


generatePdfUsingAutoTable() {
  const doc = new jspdf('l', 'pt', 'a4');
  const bName= localStorage.getItem('societyName')
  const now = new Date();
  const runDateTime = now.toLocaleString();
  const dateOnly = now.toLocaleDateString('en-GB').replace(/\//g, '/');

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${bName},${this.sys.BranchName}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Run Date & Time : ${runDateTime}`, doc.internal.pageSize.getWidth() / 2, 50, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Member List With Share As on ${dateOnly}`, doc.internal.pageSize.getWidth() / 2, 70, { align: 'center' });

  const headers = [
    "SERIAL", "MEMBER ID", "MEMBER NAME", "GUARDIAN NAME", "PRESENT ADDRESS",
    "PHONE", "MEMBERSHIP DATE", "SHARE COUNT", "SHARE BALANCE",
    "NOMINEE NAME", "NOMINEE ADDRESS"
  ];

  const data = this.filteredData.map(row =>
    headers.map(header => row[header] || '')
  );

  const totalShareBalance = this.filteredData.reduce(
    (sum, row) => sum + (parseFloat(row["SHARE BALANCE"]) || 0), 0
  );

  // Draw table
  autoTable(doc, {
    startY: 90,
    head: [headers],
    body: data,
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      1: { cellWidth: 100 },
      5: { cellWidth: 100 }
    },
    headStyles: { fillColor: [41, 128, 185] },
    theme: 'striped',
  });

  // 📌 Get the last Y position from the global doc object
  const finalY = (doc as any).lastAutoTable.finalY || 100;

  // 📌 Move to the last page manually
  const totalPages = (doc as any).getNumberOfPages();
  doc.setPage(totalPages);

  // ✅ Add the summary row manually at the end
  autoTable(doc, {
    startY: finalY + 10,
    body: [[
      {
        content: 'Total SHARE BALANCE:',
        colSpan: headers.length - 3,
        styles: { halign: 'right', fontStyle: 'bold' }
      },
      {
        content: String(totalShareBalance),
        styles: { fontStyle: 'bold' }
      },
      '', ''
    ]],
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    theme: 'plain'
  });

  doc.save('members-table.pdf');
}

setColumnWidth(column: any) {
  const columnEls = Array.from( document.getElementsByClassName('mat-column-' + column.field) );
  columnEls.forEach(( el: HTMLDivElement ) => {
    el.style.width = column.width + 'px';
  });
}

// @HostListener('window:resize', ['$event'])
// onResize(event) {
//   this.setTableResize(this.matTableRef.nativeElement.clientWidth);
// }
}
