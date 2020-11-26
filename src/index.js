import $Merge from "merge";
import $Clone from "clone";
import LoaderUtils from "loader-utils";
import $IsString from "./common/isString";

function $GetTheme(_theme){
    let theme = {}
    _theme.forEach(_item=>{
        let item = $Clone(_item)
        if($IsString(_item)) {
            if(theme.origin){
                theme.origin += item
            }else{
                theme['origin'] = item
            }
        }else{
            if(undefined === item.theme){
                theme['origin'] = item.content
            }else{
                theme[item.theme] = item.content
            }
        }
    })
    return theme
}

function $Replace(_source,_exp,_rep){
    return new Promise(function $excu(_$res,_$rej){
        let source = '',
            match = [],
            argu = [];
        
        // 替换搜索结果
        source = _source.replace(_exp,(_match,_argu) =>{
            if(_match) { match.push(_match); }
            if(_argu) { argu.push(_argu) }
            return _rep || ""
        });

        _$res({
            source,
            match:{ match, argu }
        })
    })
}

export default async function(_less){
    let callback = this.async();
    let option = $Merge({},$Clone(LoaderUtils.getOptions(this)));
    let source = '';
    // 去除theme函数
    let themeInfo = await $Replace(_less,/\.theme\((?:['|"]([a-zA-Z]{0,})['|"]\,?){0,}\);/g)
    let importInfo = await $Replace(themeInfo.source,/@import\s.{1,};(\r|\n)*?/g)
    let theme = $GetTheme(option.theme);
    let mode;
    
    // 是否有引入选项
    if(importInfo.match.match.length > 0){
        // 引入样式
        importInfo.match.match.forEach(_item=>source+=_item);
    }

    // 是否有主题选项
    if(themeInfo.match.match.length > 0){
        // 有匹配到主题色
        if(themeInfo.match.argu.length > 0) {
            mode = themeInfo.match.argu;
        }else{
            // 改变模式
            source += theme.origin
        }
    }

    if(mode){
        // 添加一个默认主题色
        source += `
            ${theme.origin}
            ${importInfo.source}
        `;
        // 在相应主题下添加一层
        mode.forEach((_mode)=>{
            source += `
            .${_mode} {
                ${theme[_mode]}
                ${importInfo.source}
            }`
        });
    }else{
        source += importInfo.source
    }
    callback(null, source);
}