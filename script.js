$(document).ready(function() {
    let rotation = 0;
    let scaleX = 1;
    let scaleY = 1;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // 选择图片按钮点击事件
    $('#selectImage').click(function() {
        $('#imageInput').click();
    });

    // 文件选择事件
    $('#imageInput').change(function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $('#preview').attr('src', e.target.result).show();
                // 重置变换
                rotation = 0;
                scaleX = 1;
                scaleY = 1;
                updateImageTransform();
            };
            reader.readAsDataURL(file);
        }
    });

    // 向左旋转
    $('#rotateLeft').click(function() {
        rotation -= 90;
        updateImageTransform();
    });

    // 向右旋转
    $('#rotateRight').click(function() {
        rotation += 90;
        updateImageTransform();
    });

    // 水平翻转
    $('#flipHorizontal').click(function() {
        scaleX *= -1;
        updateImageTransform();
    });

    // 垂直翻转
    $('#flipVertical').click(function() {
        scaleY *= -1;
        updateImageTransform();
    });

    // 更新图片变换
    function updateImageTransform() {
        $('#preview').css({
            'transform': `translate(-50%, -50%) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`
        });
    }

    // 保存图片
    $('#saveBtn').click(function() {
        const img = document.getElementById('preview');
        if (!img.src) {
            alert('请先选择一张图片！');
            return;
        }

        // 设置 canvas 尺寸
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        canvas.width = imgWidth;
        canvas.height = imgHeight;

        // 清空 canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 保存当前变换状态
        ctx.save();

        // 移动到画布中心
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // 应用旋转
        ctx.rotate(rotation * Math.PI / 180);
        
        // 应用缩放
        ctx.scale(scaleX, scaleY);

        // 绘制图片
        ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);

        // 恢复变换状态
        ctx.restore();

        // 创建下载链接
        const link = document.createElement('a');
        link.download = 'edited-image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}); 