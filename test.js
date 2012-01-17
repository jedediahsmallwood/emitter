$(document).ready(function() {
    function a() {
        var b = "";
        $("span.segmentCount").each(function() {
            if (b.length) {
                b += ","
            }
            b += $(this).attr("data-icontact-segmentid")
        });
        icp.ajax(icp.getCoreUrl("/create/send/recipient/segmentCount"), {segmentIds:b}, {success:function(c) {
            $.each(c.result, function(e) {
                var f = $("span.segmentCount[data-icontact-segmentid=" + e + "]");
                f.html(icp.formatNumber(c.result[e]) + "");
                var d = f.siblings(".showtip");
                if (d) {
                    d.html("~")
                }
            })
        },error:function() {
            $("span.segmentCount").each(function() {
                var d = $(this);
                d.html("Error: Please reload.");
                var c = d.siblings(".showtip");
                if (c) {
                    c.html("")
                }
            })
        }})
    }

    a()
});