// Excel imports are reviewed and committed only after explicit confirmation.
// Keep column names aligned with dispatch_vehicles / dispatch_drivers.
const definitions={
 vehicles:{sheet:'Danh sach xe',headers:['Biển số','Loại xe','Trạng thái'],fields:['plate','kind','status']},
 drivers:{sheet:'Danh sach lai xe',headers:['Họ và tên','Số điện thoại','Hạng GPLX'],fields:['name','phone','license']}
};
const loadExcel=async()=>{const m=await import('exceljs');return m.default||m};
async function saveWorkbook(workbook,filename){const data=await workbook.xlsx.writeBuffer();const blob=new Blob([data],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function sheetHeader(sheet,headers){sheet.addRow(headers);const row=sheet.getRow(1);row.font={bold:true,color:{argb:'FFFFFFFF'}};row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF174577'}};row.alignment={vertical:'middle',wrapText:true};row.height=28;sheet.views=[{state:'frozen',ySplit:1}];sheet.autoFilter={from:{row:1,column:1},to:{row:1,column:headers.length}};headers.forEach((h,i)=>{sheet.getColumn(i+1).width=Math.min(38,Math.max(17,h.length+8))})}
export async function downloadTemplate(type){const d=definitions[type];if(!d)throw Error('Danh mục không hợp lệ');const Excel=await loadExcel();const w=new Excel.Workbook();const s=w.addWorksheet(d.sheet);sheetHeader(s,d.headers);s.addRow(type==='vehicles'?['29C-123.45','Xe cẩu 10 tấn','Sẵn sàng']:['Nguyễn Văn A','0901234567','C']);s.getRow(2).font={color:{argb:'FF64748B'}};s.getColumn(type==='vehicles'?1:2).numFmt='@';const note=w.addWorksheet('Huong dan');note.addRow(['HƯỚNG DẪN NHẬP DANH MỤC']);note.addRow(['Dòng 1: tiêu đề cột. Dòng 2: dữ liệu ví dụ, hãy XÓA hoặc thay thế trước khi nhập.']);note.addRow(['Không đổi tên cột hoặc tên sheet đầu tiên.']);note.addRow(['Tránh biển số trùng trong danh sách xe và tên trùng trong danh sách lái xe.']);note.addRow(['Hệ thống không sửa dữ liệu có sẵn; chỉ thêm dòng mới sau khi xác nhận.']);note.getColumn(1).width=110;await saveWorkbook(w,`DIEU_HANH_XE_MAU_${type==='vehicles'?'DANH_SACH_XE':'DANH_SACH_LAI_XE'}.xlsx`)}
export async function readImportWorkbook(file,type){const d=definitions[type];if(!d)throw Error('Danh mục không hợp lệ');if(!/\.xlsx?$/i.test(file.name))throw Error('Vui lòng chọn file Excel .xlsx');if(file.size>5*1024*1024)throw Error('File vượt quá 5MB');const Excel=await loadExcel();const w=new Excel.Workbook();await w.xlsx.load(await file.arrayBuffer());const sheet=w.worksheets[0];if(!sheet)throw Error('Không có sheet dữ liệu');const header=d.headers.map((_,i)=>String(sheet.getRow(1).getCell(i+1).text||'').trim());if(d.headers.some((h,i)=>h!==header[i]))throw Error('Tiêu đề cột không đúng mẫu. Hãy dùng nút Tải mẫu Excel.');const rows=[],seen=new Set(),errors=[];sheet.eachRow((r,rowNumber)=>{if(rowNumber===1)return;const vals=d.fields.map((_,i)=>String(r.getCell(i+1).text||'').trim());if(vals.every(v=>!v))return;const item=Object.fromEntries(d.fields.map((key,i)=>[key,vals[i]]));if(type==='vehicles'){if(!item.plate||!item.kind)errors.push(`Dòng ${rowNumber}: thiếu biển số hoặc loại xe`);if(!item.status)item.status='Sẵn sàng';if(!['Sẵn sàng','Bảo dưỡng','Ngừng hoạt động'].includes(item.status))errors.push(`Dòng ${rowNumber}: trạng thái không hợp lệ`)}else{if(!item.name)errors.push(`Dòng ${rowNumber}: thiếu họ tên`);if(item.phone&&!/^[+0-9 ()-]{5,20}$/.test(item.phone))errors.push(`Dòng ${rowNumber}: số điện thoại không hợp lệ`)}const key=String(item[type==='vehicles'?'plate':'name']).toLocaleLowerCase('vi');if(seen.has(key))errors.push(`Dòng ${rowNumber}: bị trùng trong file`);seen.add(key);rows.push(item)});if(rows.length>500)throw Error('Tối đa 500 dòng cho mỗi lần nhập');if(errors.length)throw Error(errors.slice(0,4).join('; ')+(errors.length>4?'…':''));return rows}
export async function downloadReportWorkbook(rows,period,vehicleName,driverName){const Excel=await loadExcel();const w=new Excel.Workbook();const stats=[['Tổng yêu cầu',rows.length],['Chờ lãnh đạo duyệt',rows.filter(r=>r.status==='Chờ lãnh đạo duyệt').length],['Chờ cán bộ điều xe',rows.filter(r=>r.status==='Chờ cán bộ điều xe').length],['Đã phát hành',rows.filter(r=>r.status==='Đã phát hành').length],['Từ chối',rows.filter(r=>r.status==='Từ chối').length]];const s=w.addWorksheet('Tong hop');sheetHeader(s,['Chỉ tiêu','Số lượng']);s.addRow(['Kỳ báo cáo',period.mode==='week'?'Tuần chứa '+period.date:'Tháng chứa '+period.date]);stats.forEach(r=>s.addRow(r));s.getColumn(1).width=34;s.getColumn(2).width=25;const d=w.addWorksheet('Chi tiet yeu cau');const heads=['Mã yêu cầu','Đơn vị','Người đề nghị','Nhiệm vụ','Địa điểm','Bắt đầu','Kết thúc','Loại xe','Biển số','Lái xe','Trạng thái','Ghi chú lãnh đạo','Ghi chú điều hành'];sheetHeader(d,heads);rows.forEach(r=>d.addRow([r.id,r.unit,r.requester,r.purpose,r.place,r.start,r.end,r.kind,vehicleName(r.vehicle_id),driverName(r.driver_id),r.status,r.leader_note,r.manager_note]));[1,2,3,4,5,8,9,10,11,12,13].forEach(i=>d.getColumn(i).width=i===1?38:23);d.getColumn(6).width=22;d.getColumn(7).width=22;await saveWorkbook(w,`DIEU_HANH_XE_BAO_CAO_${period.mode==='week'?'TUAN':'THANG'}_${period.date}.xlsx`)}


// Request imports always start at the beginning of the approval workflow.
const requestColumns=['Đơn vị đề nghị','Người đề nghị','Loại xe cần','Nội dung công việc','Địa điểm làm việc','Bắt đầu (YYYY-MM-DD HH:mm)','Kết thúc (YYYY-MM-DD HH:mm)','Lái xe đề xuất','Ghi chú'];
export async function downloadRequestTemplate(){
 const Excel=await loadExcel();const w=new Excel.Workbook();const sheet=w.addWorksheet('Yeu cau dieu xe');sheetHeader(sheet,requestColumns);
 sheet.addRow(['Đơn vị A','Nguyễn Văn A','Xe tải 5 tấn','Chở vật tư','Kho trung tâm','2026-11-05 08:00','2026-11-05 11:00','','']);
 sheet.getRow(2).font={italic:true,color:{argb:'FF64748B'}};
 [6,7].forEach(i=>{sheet.getColumn(i).width=27;sheet.getColumn(i).numFmt='@'});
 sheet.getColumn(4).width=38;sheet.getColumn(5).width=30;
 const note=w.addWorksheet('Huong dan');[
 'MẪU NHẬP YÊU CẦU ĐIỀU XE',
 'Xóa hoặc thay thế dòng ví dụ trước khi nhập.',
 'Mọi yêu cầu nhập vào ở trạng thái Chờ lãnh đạo duyệt (không tự phát hành hoặc phân công xe).',
 'Thời gian nhập dạng YYYY-MM-DD HH:mm, ví dụ 2026-11-05 08:00.',
 'Nhập hàng loạt có thể kích hoạt thông báo lãnh đạo. Chỉ nhập khi đã kiểm tra kỹ.',
 'Không đổi tên cột hoặc sheet đầu tiên. Tối đa 100 yêu cầu mỗi file.'
 ].forEach(x=>note.addRow([x]));note.getColumn(1).width=110;
 await saveWorkbook(w,'MAU_NHAP_YEU_CAU_DIEU_XE.xlsx');
}
function parseRequestDate(cell){
 const value=cell.value;
 let date;
 if(value instanceof Date) date=value;
 else if(typeof value==='number') date=new Date(Math.round((value-25569)*86400*1000));
 else {
  const raw=String(cell.text||'').trim();
  const m=raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if(!m) return null;
  date=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]),Number(m[5]));
  if(date.getFullYear()!==Number(m[1])||date.getMonth()!==Number(m[2])-1||date.getDate()!==Number(m[3])||date.getHours()!==Number(m[4])||date.getMinutes()!==Number(m[5]))return null;
 }
 return date instanceof Date&&!Number.isNaN(date.getTime())?date:null;
}
export async function readRequestWorkbook(file){
 if(!/\.xlsx$/i.test(file.name))throw Error('Chỉ hỗ trợ file Excel .xlsx');
 if(file.size>5*1024*1024)throw Error('File vượt quá 5 MB');
 const Excel=await loadExcel();const w=new Excel.Workbook();await w.xlsx.load(await file.arrayBuffer());const sheet=w.worksheets[0];if(!sheet)throw Error('Không có sheet dữ liệu');
 if(requestColumns.some((h,i)=>String(sheet.getRow(1).getCell(i+1).text||'').trim()!==h))throw Error('Sai tiêu đề cột. Hãy tải file mẫu mới.');
 const rows=[],errors=[],seen=new Set();
 sheet.eachRow((r,n)=>{
  if(n===1)return;
  const cells=requestColumns.map((_,i)=>r.getCell(i+1));
  if(cells.every(c=>!String(c.text||'').trim()))return;
  const v=cells.map(c=>String(c.text||'').trim());
  if(v.slice(0,5).some(x=>!x))errors.push(`Dòng ${n}: thiếu thông tin bắt buộc`);
  const start=parseRequestDate(cells[5]),end=parseRequestDate(cells[6]);
  if(!start||!end||end<=start)errors.push(`Dòng ${n}: ngày giờ không hợp lệ (YYYY-MM-DD HH:mm)`);
  const key=[v[0],v[1],v[3],v[4],start?.getTime(),end?.getTime()].join('|').toLocaleLowerCase('vi');
  if(seen.has(key))errors.push(`Dòng ${n}: trùng nội dung trong file`);seen.add(key);
  if(start&&end&&end>start)rows.push({unit:v[0],requester:v[1],kind:v[2],purpose:v[3],place:v[4],start:start.toISOString(),end:end.toISOString(),driver_hint:v[7],note:v[8]});
 });
 if(rows.length>100)throw Error('Tối đa 100 yêu cầu mỗi lần nhập');
 if(errors.length)throw Error(errors.slice(0,5).join('; ')+(errors.length>5?'…':''));
 return rows;
}
