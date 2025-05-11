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
    let zoom = 100;
    let sharpness = 0;
    let blur = 0;
    let originalAspectRatio = 1;
    let originalWidth = 0;
    let originalHeight = 0;
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

    // 计算适合画布的图片尺寸
    function calculateFitSize(imgWidth, imgHeight, maxWidth, maxHeight) {
        let width = imgWidth;
        let height = imgHeight;
        
        // 如果图片尺寸超过最大尺寸，进行缩放
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        return { width, height };
    }

    // 更新尺寸输入框
    function updateSizeInputs(width, height) {
        $('#width').val(width);
        $('#height').val(height);
    }

    // 更新主画布
    function updateMainCanvas() {
        if (!originalImage) return;
        
        // 清空主画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 保存当前状态
        ctx.save();
        
        // 移动到画布中心
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // 应用缩放
        const scale = zoom / 100;
        ctx.scale(scale * scaleX, scale * scaleY);
        
        // 应用旋转
        ctx.rotate(rotation * Math.PI / 180);
        
        // 应用滤镜
        const brightness = $('#brightness').val();
        const contrast = $('#contrast').val();
        const saturation = $('#saturation').val();
        
        let filterString = '';
        if (brightness !== '0') filterString += `brightness(${100 + parseInt(brightness)}%) `;
        if (contrast !== '0') filterString += `contrast(${100 + parseInt(contrast)}%) `;
        if (saturation !== '0') filterString += `saturate(${100 + parseInt(saturation)}%) `;
        if (sharpness > 0) filterString += `contrast(${100 + sharpness}%) `;
        if (blur > 0) filterString += `blur(${blur}px) `;
        if (currentFilter) filterString += currentFilter;
        
        if (filterString) {
            ctx.filter = filterString;
        }
        
        // 计算图片在画布中的位置和尺寸
        const fitSize = calculateFitSize(originalImage.width, originalImage.height, canvas.width, canvas.height);
        
        // 绘制图片
        ctx.drawImage(
            originalImage,
            -fitSize.width / 2,
            -fitSize.height / 2,
            fitSize.width,
            fitSize.height
        );
        
        // 恢复状态
        ctx.restore();
    }

    // 更新预览画布
    function updatePreviewCanvas() {
        if (!originalImage || isTransforming) return;
        
        const now = performance.now();
        if (now - lastUpdateTime < 16) return;
        lastUpdateTime = now;

        isTransforming = true;
        requestAnimationFrame(() => {
            // 清空预览 canvas
            previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

            // 保存当前状态
            previewCtx.save();

            // 移动到画布中心
            previewCtx.translate(previewCanvas.width / 2, previewCanvas.height / 2);
            
            // 应用缩放
            const scale = zoom / 100;
            previewCtx.scale(scale * scaleX, scale * scaleY);
            
            // 应用旋转
            previewCtx.rotate(rotation * Math.PI / 180);

            // 应用滤镜
            const brightness = $('#brightness').val();
            const contrast = $('#contrast').val();
            const saturation = $('#saturation').val();
            
            let filterString = '';
            if (brightness !== '0') filterString += `brightness(${100 + parseInt(brightness)}%) `;
            if (contrast !== '0') filterString += `contrast(${100 + parseInt(contrast)}%) `;
            if (saturation !== '0') filterString += `saturate(${100 + parseInt(saturation)}%) `;
            if (sharpness > 0) filterString += `contrast(${100 + sharpness}%) `;
            if (blur > 0) filterString += `blur(${blur}px) `;
            if (currentFilter) filterString += currentFilter;
            
            if (filterString) {
                previewCtx.filter = filterString;
            }

            // 计算图片在预览画布中的位置和尺寸
            const fitSize = calculateFitSize(originalImage.width, originalImage.height, previewCanvas.width, previewCanvas.height);

            // 绘制图片
            previewCtx.drawImage(
                originalImage,
                -fitSize.width / 2,
                -fitSize.height / 2,
                fitSize.width,
                fitSize.height
            );

            // 恢复状态
            previewCtx.restore();

            // 更新预览
            $('#preview').attr('src', previewCanvas.toDataURL('image/jpeg', 0.8));

            isTransforming = false;
        });
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
                    // 清理旧的图片数据
                    if (originalImage) {
                        originalImage = null;
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
                    }

                    originalImage = img;
                    originalWidth = img.width;
                    originalHeight = img.height;
                    
                    // 设置画布尺寸
                    const maxSize = 1024;
                    const fitSize = calculateFitSize(img.width, img.height, maxSize, maxSize);
                    
                    canvas.width = fitSize.width;
                    canvas.height = fitSize.height;
                    previewCanvas.width = fitSize.width;
                    previewCanvas.height = fitSize.height;
                    
                    // 更新原始宽高比
                    originalAspectRatio = img.width / img.height;
                    
                    // 更新尺寸输入框
                    updateSizeInputs(img.width, img.height);
                    
                    // 绘制图片
                    ctx.drawImage(img, 0, 0, fitSize.width, fitSize.height);
                    
                    // 显示预览
                    $('#preview').attr('src', canvas.toDataURL('image/jpeg', 0.8)).show();
                    
                    // 重置变换
                    rotation = 0;
                    scaleX = 1;
                    scaleY = 1;
                    zoom = 100;
                    sharpness = 0;
                    blur = 0;
                    resetAdjustments();
                    updatePreviewCanvas();
                    updateMainCanvas();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // 向左旋转
    $('#rotateLeft').click(function() {
        rotation -= 90;
        updatePreviewCanvas();
        updateMainCanvas();
    });

    // 向右旋转
    $('#rotateRight').click(function() {
        rotation += 90;
        updatePreviewCanvas();
        updateMainCanvas();
    });

    // 水平翻转
    $('#flipHorizontal').click(function() {
        scaleX *= -1;
        updatePreviewCanvas();
        updateMainCanvas();
    });

    // 垂直翻转
    $('#flipVertical').click(function() {
        scaleY *= -1;
        updatePreviewCanvas();
        updateMainCanvas();
    });

    // 调整面板事件
    $('.adjustment-group input').on('input', function() {
        const value = $(this).val();
        $(this).next('span').text(value + ($(this).attr('id') === 'zoom' ? '%' : ''));
        
        // 更新相应的变量
        switch($(this).attr('id')) {
            case 'zoom':
                zoom = parseInt(value);
                break;
            case 'sharpness':
                sharpness = parseInt(value);
                break;
            case 'blur':
                blur = parseFloat(value);
                break;
        }
        
        updatePreviewCanvas();
        updateMainCanvas();
    });

    // 重置调整
    function resetAdjustments() {
        $('.adjustment-group input').val(0);
        $('.adjustment-group input#zoom').val(100);
        $('.adjustment-group span').text('0');
        $('.adjustment-group input#zoom').next('span').text('100%');
        currentFilter = '';
        updatePreviewCanvas();
        updateMainCanvas();
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
        updatePreviewCanvas();
        updateMainCanvas();
    });

    // 尺寸调整
    // 监听宽度输入
    $('#width').on('input', function() {
        if ($('#maintainAspectRatio').is(':checked')) {
            const newWidth = parseInt($(this).val());
            if (!isNaN(newWidth) && newWidth > 0) {
                const newHeight = Math.round(newWidth / originalAspectRatio);
                $('#height').val(newHeight);
            }
        }
    });

    // 监听高度输入
    $('#height').on('input', function() {
        if ($('#maintainAspectRatio').is(':checked')) {
            const newHeight = parseInt($(this).val());
            if (!isNaN(newHeight) && newHeight > 0) {
                const newWidth = Math.round(newHeight * originalAspectRatio);
                $('#width').val(newWidth);
            }
        }
    });

    // 应用尺寸调整
    $('#resizeBtn').click(function() {
        if (!originalImage) return;

        const newWidth = parseInt($('#width').val());
        const newHeight = parseInt($('#height').val());

        if (isNaN(newWidth) || isNaN(newHeight) || newWidth <= 0 || newHeight <= 0) {
            alert('请输入有效的尺寸！');
            return;
        }

        // 创建临时 canvas 进行尺寸调整
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;

        // 绘制调整后的图片
        tempCtx.drawImage(originalImage, 0, 0, originalWidth, originalHeight, 0, 0, newWidth, newHeight);

        // 更新原始图片和 canvas
        const newImage = new Image();
        newImage.onload = function() {
            originalImage = newImage;
            originalWidth = newWidth;
            originalHeight = newHeight;
            canvas.width = newWidth;
            canvas.height = newHeight;
            previewCanvas.width = newWidth;
            previewCanvas.height = newHeight;
            ctx.drawImage(newImage, 0, 0);
            
            // 更新原始宽高比
            originalAspectRatio = newWidth / newHeight;
            
            // 重置所有变换
            rotation = 0;
            scaleX = 1;
            scaleY = 1;
            resetAdjustments();
            updatePreviewCanvas();
            updateMainCanvas();
        };
        newImage.src = tempCanvas.toDataURL();
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
            updatePreviewCanvas();
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