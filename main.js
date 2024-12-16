const tableRow = (dayNo, amount) =>
    `<tr><td class="dzien">Dzień ${dayNo}</td><td>${amount}</td></tr>`;
const histTable = '<table class="hist" id="historia"></table>';
const dlDzien = 6;

const wyczyscDziwnePrzecinki = liczba =>
    Math.round(liczba * 1000) / 1000;

function drawScale(ctx, w, h, topVal, kropka) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    const barX = w / 2, barY1 = 20, barY2 = h - 20;
    const tickSmallW = 6, tickBigW = 10;
    const textRightOffset = 20, textLeftOffset = 36;
    const triangleW = 32, triangleHalfH = 10;
    ctx.beginPath();
    ctx.moveTo(barX, barY1);
    ctx.lineTo(barX, barY2);
    ctx.moveTo(barX - tickBigW, barY2);
    ctx.lineTo(barX + tickBigW, barY2);
    ctx.fillStyle = 'black';
    const measured = ctx.measureText('8');
    const numTextHeight = measured.actualBoundingBoxAscent +
        measured.actualBoundingBoxDescent;
    const hOffs = numTextHeight / 2;
    ctx.fillText(0, barX + textRightOffset, barY2 + hOffs);
    const ticksBetween = Math.floor(20 / Math.ceil(Math.log2(topVal)));
    const nOfTicks = ticksBetween * topVal;
    const multiplier = (barY2 - barY1) / nOfTicks;
    for (let i = nOfTicks; i >= 1; i--) {
        let tickSize = tickSmallW;
        const vPos = barY2 - i * multiplier;
        if (i % ticksBetween === 0) {
            tickSize = tickBigW;
            ctx.fillText(i / ticksBetween, barX + textRightOffset,
                vPos + hOffs);
        }
        ctx.moveTo(barX - tickSize, vPos);
        ctx.lineTo(barX + tickSize, vPos);
    }
    const vPosKropka = barY2 - kropka * multiplier * ticksBetween;
    const numWidth = ctx.measureText(kropka).width;
    ctx.fillText(kropka, barX - textLeftOffset - numWidth,
        vPosKropka + hOffs);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(barX - triangleW, vPosKropka - triangleHalfH);
    ctx.lineTo(barX, vPosKropka);
    ctx.lineTo(barX - triangleW, vPosKropka + triangleHalfH);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
}

function updateBrakuje(doIlu, kropka) {
    if (doIlu === kropka) {
        $('#ileBrakuje').text('Yayyy!! Cel osiągnięty!');
        return;
    }
    const brakujeTyle = wyczyscDziwnePrzecinki(doIlu - kropka);
    $('#ileBrakuje').text(`Ile brakuje Ci do celu? ${brakujeTyle}`);
}

function updateHistoria(histArr, dodane, dzien, prevDzien) {
    let historia = $('#historia');
    if (!historia.children().length) {
        $('#doPrawej').show();
    }
    if (historia.height() > $(window).height() - 200) {
        historia.removeAttr('id');
        historia.after(histTable);
        historia = $('#historia');
    }
    if (dzien === prevDzien) {
        const ostatni = historia.children().last().children().last();
        const nowa = wyczyscDziwnePrzecinki(+ostatni.text() + dodane);
        ostatni.text(nowa);
        histArr[histArr.length - 1][1] = nowa;
    } else {
        historia.append(tableRow(dzien, dodane));
        histArr.push([dzien, dodane]);
    }
}

$(document).ready(() => {
    const skala = $('#skala');
    skala.attr('width', 780).attr('height', 1200);
    skala.css('width', '234px').css('height', '360px');
    const dpi = window.devicePixelRatio;
    const w = 780 / dpi, h = 1200 / dpi;
    const ctx = skala[0].getContext('2d');
    ctx.scale(dpi, dpi);

    ctx.font = `${Math.ceil(40 / dpi)}px sans-serif`;

    let kropka = 0, doIlu = 4, dzien = 0, histArr = [];

    if (window.localStorage.licznikPradu_odwiedzono) {
        kropka = +window.localStorage.licznikPradu_kropka;
        doIlu = +window.localStorage.licznikPradu_doIlu;
        dzien = +window.localStorage.licznikPradu_dzien;
        const historia
            = JSON.parse(window.localStorage.licznikPradu_historia);
        for (const element of historia) {
            updateHistoria(histArr, element[1], element[0]);
        }
        $('#doIlu').val(doIlu);
    } else {
        $('#witamy').show()
            .text('Witamy po raz pierwszy na naszej stronie!');
        window.localStorage.licznikPradu_odwiedzono = true;
        window.localStorage.licznikPradu_kropka = 0;
        window.localStorage.licznikPradu_doIlu = doIlu;
        window.localStorage.licznikPradu_dzien = 0;
        window.localStorage.licznikPradu_historia = '[]';
    }

    drawScale(ctx, w, h, doIlu, kropka);
    updateBrakuje(doIlu, kropka);

    $('#new').click(() => {
        console.log('Rozpoczynanie nowej sesji.');
        kropka = 0, dzien = 0;
        drawScale(ctx, w, h, doIlu, kropka);
        updateBrakuje(doIlu, kropka);
        $('#historia').empty();
        $('#doPrawej .hist:not(#historia)').remove();
        histArr.length = 0;
        $('#doPrawej').hide();
        window.localStorage.licznikPradu_historia = '[]';
        window.localStorage.licznikPradu_kropka = 0;
        window.localStorage.licznikPradu_dzien = 0;
    });

    $('#doIlu').on('input', function () {
        doIlu = $(this).val();
        if (doIlu > 25 || doIlu < 2) {
            $('#error').show()
                .text(`Wpisana wartość ${doIlu} nie jest zawarta`
                + ` w obsługiwanym zakresie 2\u201325`);
            return;
        }
        $('#error').hide();
        drawScale(ctx, w, h, doIlu, kropka);
        updateBrakuje(doIlu, kropka);
        window.localStorage.licznikPradu_doIlu = doIlu;
    });

    $('#dzisiaj').keydown(function (e) {
        if (e.key === 'Enter') {
            $('#dodaj').click();
        }
    });

    $('#dodaj').click(() => {
        const ile = $('#dzisiaj').val();
        if (ile === '') {
            $('#error').show().text('Brak podanych danych!');
            return;
        }
        $('#error').hide();
        $('#dzisiaj').val('');
        kropka = wyczyscDziwnePrzecinki(kropka + +ile);
        if (kropka > doIlu) {
            kropka = doIlu;
        }
        drawScale(ctx, w, h, doIlu, kropka);
        updateBrakuje(doIlu, kropka);
        const prevDzien = dzien;
        dzien = new Date().getDate();
        updateHistoria(histArr, +ile, dzien, prevDzien);
        window.localStorage.licznikPradu_kropka = kropka;
        window.localStorage.licznikPradu_historia
            = JSON.stringify(histArr);
        window.localStorage.licznikPradu_dzien = dzien;
    });
});
