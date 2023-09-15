

class RichInputEditor{
    constructor(pParent, pInventory) {
        this.data = pInventory;
        this.input = pParent;
        this.input.setAttribute("type", "hidden");
        this.element = document.createElement('div');
        this.element.classList.add('rie-input');
        this.input.parentNode.insertBefore(this.element, this.input);
        this.element.innerHTML = "<div class='rie-field'>"+this.input.value+"</div>";
        this.field = this.element.querySelector('.rie-field');
        this.field.setAttribute("spellcheck", false);
        this.#setupInventory();
        this.#enrichContent(this.field);
        this.field.setAttribute("contentEditable", true);
        this.field.addEventListener('keyup', this.#keyUpHandler.bind(this));
        this.startIndex = 0;
    }

    #setupInventory(){
        this.inventory = document.createElement('div');
        this.inventory.classList.add('rie-inventory');
        this.inventory.classList.add('rie-hidden');
        this.data.forEach((pInv)=>{
            let d = document.createElement('div');
            d.setAttribute("data-name", pInv.name);
            d.innerHTML = pInv.name;
            if(!pInv.active){
                d.classList.add('rie-disabled');
            }
            d.addEventListener('click', this.#selectInventoryHandler.bind(this));
            this.inventory.appendChild(d);
        });
        this.element.appendChild(this.inventory);
    }

    #selectInventoryHandler(e){
        this.field.innerText = this.field.innerText.substring(0, this.startIndex)+"{$"+e.currentTarget.getAttribute("data-name")+"}";
        this.#keyUpHandler({ctrlKey:false, keyCode:false,});
    }

    #keyUpHandler(e){

        if(e.ctrlKey || [37,38,39,40].indexOf(e.keyCode)>-1) {
            return;
        }
        let s = window.getSelection();
        this.#saveSelection(s);
        let m = this.field.innerText.match(/\{\$([a-z0-9\-_]*)$/);
        if(m && m.length){
            this.inventory.style.display = "block";
            if(m[1].length === 0){
                this.inventory.querySelectorAll('div').forEach((pDiv)=>{
                    pDiv.classList.remove('rie-hidden');
                });
                let r = s.getRangeAt(0);
                let rect = r.getClientRects();
                if(rect.length){
                    let x = rect[0].x - (this.field.getBoundingClientRect()).x;
                    this.inventory.style.left = x+"px";
                }
                let index = s.anchorOffset-2;//-2 -> ${
                let p = s.anchorNode;
                while((p = p.previousSibling)){
                    index += p.innerText.length;
                }
                this.startIndex = index;
            }else{
                this.inventory.querySelectorAll('div').forEach((pDiv)=>{
                    let n = pDiv.getAttribute("data-name");
                    pDiv.classList[(n.indexOf(m[1])===0)?"remove":"add"]('rie-hidden');
                });
                if(this.inventory.querySelectorAll('div.rie-hidden').length===this.inventory.querySelectorAll('div').length){
                    this.inventory.style.display = "none";
                }
            }
        }else{
            this.inventory.style.display = "none";
        }

        this.#enrichContent();
        this.#restoreSelection();
        this.input.value = this.field.innerText;
    }

    #saveSelection(pSelection){
        this.anchorOffset = pSelection.anchorOffset;
        this.anchorIndex = 0;
        let p = pSelection.anchorNode;
        while((p = p.previousSibling)){
            this.anchorIndex++;
        }
        this.childrenCount = this.#countChildren();
        console.log("count : ", this.childrenCount, "index : ", this.anchorIndex, "offset : ", this.anchorOffset);
    }

    #restoreSelection(){
        let childrenCount = this.#countChildren();
        console.log("old count : ", this.childrenCount, "new count : ", childrenCount);

        let selection = window.getSelection();
        let range = document.createRange();
        let anchorTarget = this.field.firstChild;
        while(this.anchorIndex>0){
            this.anchorIndex--;
            anchorTarget = anchorTarget.nextSibling;
        }
        if(anchorTarget.length<this.anchorOffset){
            console.log("offset too high");
            anchorTarget = anchorTarget.nextSibling;
            this.anchorOffset = this.anchorOffset - anchorTarget.length;
        }
        console.log(anchorTarget);
        range.setStart(anchorTarget, this.anchorOffset);
        range.setEnd(anchorTarget, this.anchorOffset);
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
            inventory.forEach((pInventory)=>{
                if(pInventory.name !== pMatch[2]){
                    return;
                }
                val = pInventory.value;
                cls.push("rie-inv");
                if(!pInventory.active){
                    cls.push("rie-disabled");
                }
            });
            text = text.replaceAll(pMatch[1], "<span title='"+val+"' class='"+cls.join(" ")+"'>"+pMatch[1]+"</span>");
        });
        this.field.innerHTML = text;
    }
}