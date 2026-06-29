Use case ID	Gami-1
Use case name	Điểm danh hàng ngày
Description	Cho phép người điểm danh hàng ngày theo khung giờ quy định để nhận thưởng Lotus+
Actor	Người dùng app
Priority	1
Trigger	Người dùng nhấn mục Điểm danh
Pre-condition	Người dùng đã đăng nhập app
Post-condition	Hiển thị màn hình Điểm danh hàng ngày
Main flow	1.	User: đăng nhập app và chọn mục Điểm danh hàng ngày tại màn Home
2.	System: Hiển thị màn hình Điểm danh hàng ngày
3.	User: chọn button Điểm danh
4.	System: cộng điểm Lotus+ cho user, chuyển button Điểm danh sang Đã điểm danh
Exceptional flow	--Người dùng vào điểm danh đúng khung giờ quy định
2b. System: không hiển thị button Điểm danh
Business rule	1.	User cần điểm danh vào đúng khung giờ cho phép: 9h-11h hoặc 19h-21h
2.	Cho phép điểm danh tối đa 1 lần mỗi ngày
3.	Mỗi lần điểm danh + theo số điểm config như sau:
a.	Ngày 1 được + 1 điểm
b.	Ngày 2 được + 2 điểm
c.	Ngày 3 được + 3 điểm
d.	Ngày 4 được + 5 điểm
e.	Ngày 5 được + 8 điểm
f.	Ngày 6 được + 13 điểm
g.	Ngày 7 được + 21 điểm
4.	User không bắt buộc phải điểm danh theo các ngày liên tiếp
5.	Mỗi tháng điểm danh tối đa 7 ngày và qua tháng thì reset điểm danh lại từ đầu.

1/ API tạo người dùng. 
2/ API get profile người dùng. 
3/ API get danh sách các trạng thái các ngày điểm danh. (thể hiện rõ ngày nào đã điểm danh, ngày nào chưa)
4/ API điểm danh. (Gợi ý dùng redis để đánh dấu ngày nào đã điểm danh & áp dụng lock distributed của Redis)
5/ API lịch sử cộng điểm. (Phân trang đầy đủ)
6/ API trừ điểm 
