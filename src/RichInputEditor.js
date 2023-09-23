class RichInputEditor{
    constructor(pParent, pInventory) {
        this.input = pParent;
        this.element = document.createElement('div');
        this.element.classList.add('rie-input');
        this.input.parentNode.insertBefore(this.element, this.input);
        this.element.innerHTML = "<div class='rie-field'>"+this.input.value+"</div>";
        this.field = this.element.querySelector('.rie-field');
        this.field.setAttribute("spellcheck", false);
        this.setInventory(pInventory);
        this.field.setAttribute("contentEditable", true);
        this.field.addEventListener('keyup', this.#keyUpHandler.bind(this));
        this.field.addEventListener('keydown', this.#keyDownHandler.bind(this));
        this.startIndex = 0;
        this.input.setAttribute("type", "hidden");
    }

    setInventory(pInventory){
        this.data = pInventory;
        if(!this.inventory){
            this.inventory = document.createElement('div');
            this.inventory.classList.add('rie-inventory');
            this.inventory.classList.add('rie-hidden');
            this.element.appendChild(this.inventory);
        }
        this.inventory.innerHTML = "";
        this.data.forEach((pInv)=>{
            let d = document.createElement('div');
            d.setAttribute("data-name", pInv.name);
            d.innerHTML = '<span class="rie-name">'+pInv.name + '</span> - <span class="rie-val">'+pInv.value+'</span>';
            if(!pInv.active){
                d.classList.add('rie-disabled');
            }
            d.addEventListener('click', this.#selectInventoryHandler.bind(this));
            this.inventory.appendChild(d);
        });
        this.#enrichContent();
    }

    #selectInventoryHandler(e){
        this.#saveSelection(window.getSelection());
        this.field.innerText = this.field.innerText.slice(0, this.startIndex)+"{$"+e.currentTarget.getAttribute("data-name")+"}"+this.field.innerText.slice(this.endIndex);
        this.#keyUpHandler({ctrlKey:false, keyCode:false});
        this.inventory.classList.add('rie-hidden');
    }

    #keyDownHandler(e){
        if(e.keyCode === 27){
            this.inventory.classList.add('rie-hidden');
        }
        if(e.keyCode === 38 || e.keyCode === 40){
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            if(!this.inventory.classList.contains('rie-hidden')){
                this.#circleThroughInventory(e.keyCode=== 40);
            }
        }
        if(e.keyCode === 13 || e.keyCode === 9){
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            if(!this.inventory.classList.contains('rie-hidden')){
                this.#selectInventoryHandler({currentTarget:this.inventory.querySelector('div.selected')});
            }
        }
    }

    #circleThroughInventory(pNext){
        let selectedIndex;
        let availableItems = this.inventory.querySelectorAll('div:not(.rie-hidden)');
        availableItems.forEach((pDiv, pIndex)=>{
            if(pDiv.classList.contains('selected')){
                selectedIndex = pIndex;
            }
        });
        if(pNext){
            selectedIndex = selectedIndex === availableItems.length-1?0:selectedIndex+1;
        }else{
            selectedIndex = selectedIndex === 0 ? availableItems.length-1:selectedIndex-1;
        }
        this.inventory.querySelector('div.selected').classList.remove('selected');
        availableItems.forEach((pDiv, pIndex)=>{
            if(selectedIndex === pIndex){
                pDiv.classList.add('selected');
            }
        });
    }

    #keyUpHandler(e){
        if(e.ctrlKey || [13,9,27,37,38,39,40,91].indexOf(e.keyCode)>-1) {
            return;
        }
        let s = window.getSelection();
        let realKeyUpEvent = e.keyCode !== false;
        if(realKeyUpEvent){
            this.#saveSelection(s);
        }
        this.#handleInventory(s);
        this.#enrichContent();
        this.#restoreSelection(realKeyUpEvent);
        this.input.value = this.field.innerText;
    }

    #handleInventory(pSelection){
        let m = this.field.innerText.slice(0, this.completeOffset).match(/\{\$([a-z0-9\-_]*)$/);
        if(m && m.length){
            this.inventory.classList.remove('rie-hidden');
            let hasSelected = false;
            this.inventory.querySelectorAll('div').forEach((pDiv)=>{
                let n = pDiv.getAttribute("data-name");
                let found = (n.indexOf(m[1])===0);
                pDiv.classList[found?"remove":"add"]('rie-hidden');
                pDiv.classList.remove('selected');
                if(found && !hasSelected){
                    hasSelected = true;
                    pDiv.classList.add('selected');
                }
                pDiv.querySelector('.rie-name').innerHTML = found?n.replace(m[1], '<b>'+m[1]+'</b>'):n;
            });
            if(this.inventory.querySelectorAll('div.rie-hidden').length===this.inventory.querySelectorAll('div').length){
                this.inventory.classList.add('rie-hidden');
            }
            let r = pSelection.getRangeAt(0);
            let rect = r.getClientRects();
            if(rect.length){
                this.startIndex = m.index;
                this.endIndex = m.index + m[0].length;
                let t = this.field.innerText;
                this.field.innerHTML = t.slice(0, m.index)+"<i>"+m[0]+"</i>"+t.slice(m.index);
                let x = this.field.querySelector('i').getBoundingClientRect().left;
                this.inventory.style.left = x+"px";
                this.field.innerHTML = t;
            }
        }else{
            this.inventory.classList.add('rie-hidden');
        }
    }

    #saveSelection(pSelection){
        this.completeOffset = pSelection.anchorOffset;
        let p = pSelection.anchorNode;
        if(pSelection.anchorNode.parentNode.nodeName === "SPAN"){
            p = pSelection.anchorNode.parentNode;
        }
        while((p = p.previousSibling)){
            this.completeOffset+=p.textContent.length;
        }
    }

    #restoreSelection(pUseSavedOffset){

        let selection = window.getSelection();
        let range = document.createRange();

        let off = pUseSavedOffset?this.completeOffset:this.field.innerText.length;
        let p = this.field.firstChild;
        while(off>0 && p){
            if(off >= p.textContent.length){
                off -= p.textContent.length;
                p = p.nextSibling;
            }else{
                break;
            }
        }

        if(!p){
            p = this.field.lastChild;
            off = p.textContent.length;
        }

        if(p.nodeName === "SPAN"){
            p = p.firstChild;
        }

        range.setStart(p, off);
        range.setEnd(p, off);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    #countChildren(){
        let count = 1;
        let c = this.field.firstChild;
        while((c = c.nextSibling)){
            count++;
        }
        return count;
    }

    #enrichContent(){
        let text = this.field.innerText;
        let matches = text.matchAll(/(\{\$([a-z0-9\-_]+)})/gi);
        Array.from(matches).reverse().forEach((pMatch)=>{
            let cls = [];
            let val;
            this.data.forEach((pInventory)=>{
                if(pInventory.name !== pMatch[2]){
                    return;
                }
                val = pInventory.value;
                cls.push("rie-inv");
                if(!pInventory.active){
                    cls.push("rie-disabled");
                }
            });
            let start = text.slice(0, pMatch.index);
            let end = text.slice(pMatch.index+pMatch[1].length, text.length);
            text = start + "<span title='"+val+"' class='"+cls.join(" ")+"'>"+pMatch[1]+"</span>" + end;
        });
        this.field.innerHTML = text;
    }
}