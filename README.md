# invite chan

Một trang web dưới dạng những bức thư tương tác để gửi lời mời tới Chan và lưu câu trả lời vào Google Sheets.

## Chạy ứng dụng

Yêu cầu Node.js 20.19+ hoặc 22.12+.

```bash
npm install
npm run dev
```

Mở URL Vite hiển thị trong terminal. Chạy `npm test` để kiểm tra logic câu trả lời và `npm run build` để đóng gói thư mục `dist/` (có thể triển khai trên bất kỳ dịch vụ hosting tĩnh nào).

### Kết nối Google Sheets

Ứng dụng cần **URL Web app Google Apps Script** do chủ sở hữu Sheet tự tạo; chưa có URL thì giao diện vẫn xem và thử luồng được, nhưng nút gửi sẽ báo chưa cấu hình thay vì báo thành công giả.

1. Tạo Google Sheet mới → **Extensions → Apps Script**; dán nội dung `apps-script/Code.gs` vào tệp `Code.gs` của dự án Apps Script gắn với Sheet đó.
2. **Deploy → New deployment → Web app**. Chọn **Execute as: Me** và **Who has access: Anyone** để người nhận thư không cần đăng nhập Google; cấp các quyền được yêu cầu. Copy URL kết thúc bằng `/exec` (không phải `/dev`). Nếu sửa Apps Script sau này, cần triển khai phiên bản mới.
3. Tạo tệp `.env.local` tại thư mục dự án với nội dung (thay URL bằng URL thực của bạn):

   ```dotenv
   VITE_SHEET_URL=https://script.google.com/macros/s/ID_CUA_BAN/exec
   ```

4. Khởi động lại `npm run dev` hoặc chạy `npm run build` rồi triển khai lại. Thử gửi một câu trả lời và kiểm tra Sheet: một dòng với mã gửi, thời gian, lời mời, lý do, món ăn, món tự chọn và câu trả lời đi uống nước. Thử lại sau lỗi sẽ dùng cùng mã gửi để tránh ghi trùng.

**Lưu ý:** URL Apps Script được nhúng trong mã phía client, không phải bí mật; triển khai công khai có thể nhận thư rác. Không lưu dữ liệu nhạy cảm trong form và chỉ chia sẻ đường dẫn cho người cần dùng. Ảnh món ăn tải từ Unsplash và font tải từ Google Fonts; nếu cần chạy hoàn toàn offline, thay bằng tài nguyên lưu trong dự án.

## Công nghệ và hiệu ứng

- Dùng HTML, CSS và JavaScript để xây dựng giao diện, biểu mẫu và điều khiển luồng trả lời.
- Dùng Three.js cho hiệu ứng 3D: mở thư, phép thuật quét từ trên xuống khi chuyển cảnh, và các hiệu ứng trang trí phù hợp. Giao diện cần dùng được trên điện thoại; hiệu ứng nên có phương án giảm chuyển động nếu người dùng bật tùy chọn này.
- Gửi câu trả lời vào Google Sheets thông qua một endpoint Google Apps Script. Chỉ ghi dữ liệu khi người nhận bấm **Gửi câu trả lời** ở bước cuối; hiển thị trạng thái thành công hoặc lỗi và cho phép thử lại nếu gửi thất bại.

## Luồng trải nghiệm

### Mở thư và lời mời đầu tiên

Ban đầu hiển thị một bức thư đóng. Khi bấm/chạm vào, bức thư mở ra với hiệu ứng 3D và hiện nội dung. Trên điện thoại, thư có ánh sáng và các ngôi sao chuyển động nhẹ khi chờ; khi chạm, nắp bật lên, giấy trượt ra rồi phép thuật quét qua trước khi hiện lời mời (không phụ thuộc hiệu ứng hover). Khi bật tùy chọn giảm chuyển động, bỏ qua các chuyển động này và hiện nội dung ngay:

```text
Hi người đẹp, vẫn để lại lịch tối nay cho tôi chứ ?
Do vẫn nợ bà 2 ân tình, tôi xin phép nhân dịp này để trả cho bà cả 2 nha :)
note: không bấm no được đou đừng cố :)
```

Hai lựa chọn **Yes** và **No**:

- **Yes:** phép thuật quét từ trên xuống bức thư rồi chuyển sang **Ân tình 1**.
- **No:** trong 3 lần bấm đầu tiên, nút nhảy sang vị trí khác trong vùng hiển thị; ở vị trí cũ xuất hiện icon tức giận bay lên. Từ lần bấm thứ 4, nút có thể bấm được và mở form nhập lý do từ chối. Sau khi điền lý do, chuyển thẳng tới bước **Xem lại và gửi**, bỏ qua hai ân tình. Người nhận luôn có thể từ chối; không để nút nhảy ra ngoài màn hình.

### Ân tình 1 — Mời ăn

Nội dung bức thư:

```text
Để tui mời bà một bữa nha !
```

Hiển thị các card có ảnh và tên món ăn, chỉ chọn được một card; các card còn lại tối đi khi đã chọn:

1. Mì cay
2. Cơm nhật / Ramen
3. Jolibee
4. Tuỳ chọn

Khi chọn **Tuỳ chọn**, hiển thị ô để nhập món muốn ăn; cần nhập món trước khi xác nhận. Nút **Xác nhận** lưu lựa chọn tạm thời và chuyển sang **Ân tình 2** bằng hiệu ứng phép thuật tương tự.

### Ân tình 2 — Mời đi uống nước

Nội dung bức thư:

```text
Ăn mà không uống thì phí phạm, tui có biết một quán nước khá chill, có board game để chơi nên sẽ không nhàm chán (chắc vậy)
do u wanna go?
note: lần này thì bấm no được @@
```

Hai nút **Yes** và **No** đều bấm được bình thường. Sau khi chọn, chuyển sang bước **Xem lại và gửi**.

### Xem lại và gửi

- Hiển thị các câu trả lời đã chọn để người nhận kiểm tra trước khi gửi. Nếu từ chối lời mời đầu tiên, chỉ hiển thị lựa chọn **No** và lý do; không hiển thị món ăn hay câu hỏi đi uống nước.
- Cho phép quay lại chỉnh sửa câu trả lời trước khi gửi.
- Chỉ khi bấm **Gửi câu trả lời** mới ghi một dòng vào Google Sheets, gồm thời gian gửi, câu trả lời lời mời đầu tiên, lý do từ chối (nếu có), món ăn đã chọn hoặc nội dung tuỳ chọn (nếu có), và câu trả lời lời mời đi uống nước (nếu có). Các mục bị bỏ qua để trống.
- Gửi thành công: hiển thị màn hình cảm ơn với lời nhắn phù hợp cho trường hợp đồng ý hoặc từ chối. Gửi thất bại: giữ nguyên câu trả lời và cho phép thử lại, không báo thành công khi chưa lưu được.
