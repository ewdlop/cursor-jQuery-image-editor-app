$(document).ready(function() {
    let rotation = 0;
    let scaleX = 1;
    let scaleY = 1;
    // let isCropping = false;
    // let cropStartX, cropStartY;
    let currentFilter = '';
    // let isResizing = false;
    // let resizeHandle = null;
    let originalImage = null;
    let isTransforming = false;
    let lastUpdateTime = 0;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const previewCanvas = document.createElement('canvas');
    const previewCtx = previewCanvas.getContext('2d', { alpha: false });

    // 节流函数
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

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
                const img = new Image();
                img.onload = function() {
                    originalImage = img;
                    // 设置 canvas 尺寸
                    const maxSize = 1024; // 限制最大尺寸
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = Math.round((height * maxSize) / width);
                            width = maxSize;
                        } else {
                            width = Math.round((width * maxSize) / height);
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    previewCanvas.width = width;
                    previewCanvas.height = height;
                    
                    // 绘制原始图片
                    ctx.drawImage(img, 0, 0, width, height);
                    // 显示预览
                    $('#preview').attr('src', canvas.toDataURL('image/jpeg', 0.8)).show();
                    // 重置变换
                    rotation = 0;
                    scaleX = 1;
                    scaleY = 1;
                    resetAdjustments();
                    updateImageTransform();
                };
                img.src = e.target.result;
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
    const updateImageTransform = throttle(function() {
        if (!originalImage || isTransforming) return;
        
        const now = performance.now();
        if (now - lastUpdateTime < 16) return; // 限制更新频率
        lastUpdateTime = now;

        isTransforming = true;
        requestAnimationFrame(() => {
            // 清空预览 canvas
            previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

            // 保存当前状态
            previewCtx.save();

            // 移动到画布中心
            previewCtx.translate(previewCanvas.width / 2, previewCanvas.height / 2);
            
            // 应用旋转
            previewCtx.rotate(rotation * Math.PI / 180);
            
            // 应用缩放
            previewCtx.scale(scaleX, scaleY);

            // 应用滤镜
            const brightness = $('#brightness').val();
            const contrast = $('#contrast').val();
            const saturation = $('#saturation').val();
            
            if (brightness !== '0' || contrast !== '0' || saturation !== '0' || currentFilter) {
                previewCtx.filter = `${brightness !== '0' ? `brightness(${100 + parseInt(brightness)}%) ` : ''}
                            ${contrast !== '0' ? `contrast(${100 + parseInt(contrast)}%) ` : ''}
                            ${saturation !== '0' ? `saturate(${100 + parseInt(saturation)}%) ` : ''}
                            ${currentFilter}`;
            }

            // 绘制图片
            previewCtx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);

            // 恢复状态
            previewCtx.restore();

            // 更新预览
            $('#preview').attr('src', previewCanvas.toDataURL('image/jpeg', 0.8));

            isTransforming = false;
        });
    }, 16);

    // 调整面板事件
    $('.adjustment-group input').on('input', function() {
        $(this).next('span').text($(this).val());
        updateImageTransform();
    });

    // 重置调整
    function resetAdjustments() {
        $('.adjustment-group input').val(0);
        $('.adjustment-group span').text('0');
        currentFilter = '';
        updateImageTransform();
    }

    // 滤镜按钮事件
    $('.filter-btn').click(function() {
        const filter = $(this).data('filter');
        if (filter === 'reset') {
            currentFilter = '';
        } else {
            switch(filter) {
                case 'grayscale':
                    currentFilter = 'grayscale(100%)';
                    break;
                case 'sepia':
                    currentFilter = 'sepia(100%)';
                    break;
                case 'blur':
                    currentFilter = 'blur(5px)';
                    break;
            }
        }
        updateImageTransform();
    });

    // 裁剪功能
    $('#cropBtn').click(function() {
        alert('裁剪功能暂时不可用');
        return;
        /*
        isCropping = !isCropping;
        if (isCropping) {
            const $img = $('#preview');
            const $area = $('.crop-area');
            const imgWidth = $img.width();
            const imgHeight = $img.height();
            
            // 设置裁剪区域初始大小和位置
            $area.css({
                width: imgWidth * 0.8,
                height: imgHeight * 0.8,
                left: (imgWidth - imgWidth * 0.8) / 2,
                top: (imgHeight - imgHeight * 0.8) / 2,
                display: 'block'
            });
            
            $(this).text('完成裁剪');
        } else {
            $('.crop-area').hide();
            $(this).text('裁剪');
            applyCrop();
        }
        */
    });

    // 裁剪区域拖动
    $('.crop-area').on('mousedown', function(e) {
        if (!isCropping || isResizing) return;
        
        const $area = $(this);
        const startX = e.pageX - $area.offset().left;
        const startY = e.pageY - $area.offset().top;
        
        $(document).on('mousemove', function(e) {
            const $container = $area.parent();
            const containerOffset = $container.offset();
            const newX = e.pageX - containerOffset.left - startX;
            const newY = e.pageY - containerOffset.top - startY;
            
            // 限制裁剪区域不超出图片范围
            const maxX = $container.width() - $area.width();
            const maxY = $container.height() - $area.height();
            
            $area.css({
                left: Math.max(0, Math.min(newX, maxX)),
                top: Math.max(0, Math.min(newY, maxY))
            });
        });

        $(document).on('mouseup', function() {
            $(document).off('mousemove mouseup');
        });
    });

    // 调整大小功能
    $('.resize-handle').on('mousedown', function(e) {
        if (!isCropping) return;
        e.stopPropagation();
        
        isResizing = true;
        resizeHandle = $(this).attr('class').split(' ')[1];
        
        const $area = $('.crop-area');
        const startX = e.pageX;
        const startY = e.pageY;
        const startWidth = $area.width();
        const startHeight = $area.height();
        const startLeft = $area.position().left;
        const startTop = $area.position().top;
        
        $(document).on('mousemove', function(e) {
            const $container = $area.parent();
            const deltaX = e.pageX - startX;
            const deltaY = e.pageY - startY;
            
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;
            
            // 根据不同的调整手柄计算新的尺寸和位置
            switch(resizeHandle) {
                case 'nw':
                    newWidth = startWidth - deltaX;
                    newHeight = startHeight - deltaY;
                    newLeft = startLeft + deltaX;
                    newTop = startTop + deltaY;
                    break;
                case 'ne':
                    newWidth = startWidth + deltaX;
                    newHeight = startHeight - deltaY;
                    newTop = startTop + deltaY;
                    break;
                case 'sw':
                    newWidth = startWidth - deltaX;
                    newHeight = startHeight + deltaY;
                    newLeft = startLeft + deltaX;
                    break;
                case 'se':
                    newWidth = startWidth + deltaX;
                    newHeight = startHeight + deltaY;
                    break;
            }
            
            // 限制最小尺寸
            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(50, newHeight);
            
            // 限制不超出容器
            const maxWidth = $container.width() - newLeft;
            const maxHeight = $container.height() - newTop;
            newWidth = Math.min(newWidth, maxWidth);
            newHeight = Math.min(newHeight, maxHeight);
            
            // 限制不超出左边界和上边界
            if (newLeft < 0) {
                newWidth += newLeft;
                newLeft = 0;
            }
            if (newTop < 0) {
                newHeight += newTop;
                newTop = 0;
            }
            
            $area.css({
                width: newWidth,
                height: newHeight,
                left: newLeft,
                top: newTop
            });
        });

        $(document).on('mouseup', function() {
            isResizing = false;
            resizeHandle = null;
            $(document).off('mousemove mouseup');
        });
    });

    // 应用裁剪
    function applyCrop() {
        if (!originalImage) return;

        const $area = $('.crop-area');
        const $img = $('#preview');
        const imgRect = $img[0].getBoundingClientRect();
        const areaRect = $area[0].getBoundingClientRect();

        // 计算裁剪区域相对于图片的比例
        const scaleX = originalImage.width / imgRect.width;
        const scaleY = originalImage.height / imgRect.height;

        const cropX = (areaRect.left - imgRect.left) * scaleX;
        const cropY = (areaRect.top - imgRect.top) * scaleY;
        const cropWidth = areaRect.width * scaleX;
        const cropHeight = areaRect.height * scaleY;

        // 创建新的 canvas 用于裁剪
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // 设置临时 canvas 的尺寸为裁剪区域的尺寸
        tempCanvas.width = cropWidth;
        tempCanvas.height = cropHeight;

        // 在临时 canvas 上绘制裁剪后的图片
        tempCtx.drawImage(
            canvas,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );

        // 更新原始图片和 canvas
        const newImage = new Image();
        newImage.onload = function() {
            originalImage = newImage;
            canvas.width = newImage.width;
            canvas.height = newImage.height;
            ctx.drawImage(newImage, 0, 0);
            
            // 重置所有变换
            rotation = 0;
            scaleX = 1;
            scaleY = 1;
            resetAdjustments();
            updateImageTransform();
        };
        newImage.src = tempCanvas.toDataURL();
    }

    // 保存图片
    $('#saveBtn').click(function() {
        if (!originalImage) {
            alert('请先选择一张图片！');
            return;
        }

        // 创建下载链接
        const link = document.createElement('a');
        link.download = 'edited-image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}); 