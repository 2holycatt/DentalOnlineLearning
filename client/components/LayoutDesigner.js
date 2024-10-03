import React, { useState } from "react";
import GridLayout from "react-grid-layout";
import TextComponent from "./TextComponent";
import ImageComponent from "./ImageComponent";
import VideoComponent from "./VideoComponent";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "../styles/styles.css";

const LayoutDesigner = () => {
  const [layout, setLayout] = useState([]);

  const addComponent = (type) => {
    if (type === 'text' || type === 'video') {
      const newComponent = {
        i: `${type}-${layout.length}`,
        x: 0,
        y: Infinity, // จะเพิ่มที่ด้านล่างสุด
        w: 4,
        h: 2,
        type: type,
      };
      setLayout([...layout, newComponent]);
    } else if (type === 'image') {
      const fileInput = document.createElement('input'); // สร้าง input element
      fileInput.type = 'file'; // กำหนด type เป็น file
      fileInput.accept = 'image/*'; // กำหนดให้รับเฉพาะไฟล์รูปภาพ
      fileInput.style.display = 'none'; // ซ่อน input element
      fileInput.onchange = (event) => { // เมื่อมีการเลือกไฟล์
        const file = event.target.files[0];
        if (file) {
          const imageUrl = URL.createObjectURL(file); // สร้าง URL ของรูปภาพ
          const newComponent = {
            i: `${type}-${layout.length}`,
            x: 0,
            y: Infinity, // จะเพิ่มที่ด้านล่างสุด
            w: 4,
            h: 2,
            type: type,
            imageUrl: imageUrl, // เก็บ URL ของรูปภาพ
          };
          setLayout([...layout, newComponent]); // เพิ่ม component ลงใน layout
        }
      };
      document.body.appendChild(fileInput); // เพิ่ม input element เข้าไปใน DOM
      fileInput.click(); // คลิกที่ input element ซึ่งจะเปิด dialog เพื่อเลือกไฟล์
    }
  };



  const removeComponent = (i) => {
    const newLayout = layout.filter((item) => item.i !== i);
    setLayout(newLayout);
  };

  const saveLayout = () => {
    fetch("/save-layout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: "123", // แทนที่ด้วย user ID จริง
        layout: layout
      })
    })
      .then((response) => response.text())
      .then((data) => {
        alert(data);
      });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const componentId = event.dataTransfer.getData("componentId");
    removeComponent(componentId);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDragStart = (event, componentId) => {
    event.dataTransfer.setData("componentId", componentId);
  };

  return (
    <div>
      <button class="btn-widget p-1 mx-1" onClick={() => addComponent("text")}>หัวข้อ</button>
      <button class="btn-widget p-1 mx-1" onClick={() => addComponent("text")}>ข้อความบรรยาย</button>
      <button class="btn-widget p-1 mx-1" onClick={() => addComponent("image")}>รูปภาพหรือวิดีโอ</button>
      <button class="btn-widget p-1 mx-1" onClick={() => addComponent("image")}>ไฟล์</button>
      <button class="btn-widget p-1 mx-1" onClick={() => addComponent("text")}>ลิงค์ (link)</button>
      {/* <button class="btn-widget p-1 mx-1" onClick={() => addComponent("video")}>Add Video</button> */}
      <GridLayout
        className="layout-react"
        layout={layout}
        cols={12}
        rowHeight={30}
        width={1200}
        onLayoutChange={(newLayout) => setLayout(newLayout)}
      >
        {layout.map((item) => (
          <div key={item.i} className="grid-item" draggable="true" onDragStart={(event) => handleDragStart(event, item.i)}>
            {item.type === "text" && <TextComponent />}
            {item.type === "image" && (
              <ImageComponent
              // เพิ่ม props เพื่อจัดการอินพุต URL ของรูปภาพหรือการอัปโหลดไฟล์ (อธิบายเพิ่มเติมภายหลัง)
              />
            )}
            {item.type === "video" && (
              <VideoComponent
              // เพิ่ม props เพื่อจัดการอินพุต URL ของวิดีโอหรือการอัปโหลดไฟล์ (อธิบายเพิ่มเติมภายหลัง)
              />
            )}
          </div>
        ))}
      </GridLayout>
      <div
        className="delete-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        class="my-2 mx-1 delete-area"
      >
        Drop here to delete
      </div>
      <div class="d-flex justify-content-end save-btn">
        <button onClick={saveLayout} class="btn btn-success py-1 px-2 my-2 mx-1">บันทึก</button>
      </div>
    </div>
  );
};

export default LayoutDesigner;
