<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
    xmlns:html="http://www.w3.org/TR/REC-html40"
    xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>XML Sitemap | TGSTechInfo</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 24px;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            padding: 32px;
            border: 1px solid #e2e8f0;
          }
          h1 {
            color: #0f172a;
            font-size: 26px;
            font-weight: 700;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
          }
          .badge {
            display: inline-block;
            background: #2563eb;
            color: #ffffff;
            font-size: 13px;
            padding: 6px 14px;
            border-radius: 9999px;
            font-weight: 600;
            letter-spacing: 0.02em;
          }
          p.desc {
            color: #64748b;
            font-size: 14px;
            margin: 0 0 24px 0;
            line-height: 1.6;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }
          .stat-card {
            background: #f8fafc;
            border-radius: 10px;
            padding: 16px 20px;
            border: 1px solid #e2e8f0;
          }
          .stat-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            font-weight: 600;
          }
          .stat-value {
            font-size: 26px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 4px;
          }
          .search-bar {
            margin-bottom: 20px;
          }
          .search-bar input {
            width: 100%;
            padding: 12px 18px;
            font-size: 14px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            outline: none;
            box-sizing: border-box;
            background: #ffffff;
            transition: all 0.2s;
          }
          .search-bar input:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
          }
          .table-wrapper {
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 600;
            text-align: left;
            padding: 12px 16px;
            border-bottom: 2px solid #e2e8f0;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
          }
          td {
            padding: 11px 16px;
            border-bottom: 1px solid #f1f5f9;
            word-break: break-all;
          }
          tr:hover td {
            background: #f8fafc;
          }
          a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
          }
          a:hover {
            text-decoration: underline;
            color: #1d4ed8;
          }
          .priority-tag {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 12px;
            background: #e0f2fe;
            color: #0369a1;
          }
          .freq-tag {
            color: #64748b;
            font-size: 12px;
          }
          .footer {
            margin-top: 32px;
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>
            <span>TGSTechInfo XML Sitemap</span>
            <span class="badge">Search Engine Compliant (Sitemaps 0.9)</span>
          </h1>
          <p class="desc">
            This XML Sitemap provides a complete index of all published pages, articles, categories, and author profiles on <a href="https://tgstechinfo.com" target="_blank">tgstechinfo.com</a>. Search engines like Google, Bing, and Yahoo use this file to discover and crawl content.
          </p>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">Total URLs in Sitemap</div>
              <div class="stat-value"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Protocol Version</div>
              <div class="stat-value" style="font-size: 18px; line-height: 32px;">Sitemaps XML 0.9</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Status</div>
              <div class="stat-value" style="font-size: 18px; color: #16a34a; line-height: 32px;">Active &amp; Valid</div>
            </div>
          </div>
          <div class="search-bar">
            <input type="text" id="sitemapSearch" placeholder="Filter URLs by keyword (e.g. article, news, blog, author, slug)..." onkeyup="filterSitemap()" />
          </div>
          <div class="table-wrapper">
            <table id="sitemapTable">
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  <th>URL</th>
                  <th style="width: 80px;">Priority</th>
                  <th style="width: 110px;">Change Freq</th>
                  <th style="width: 170px;">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td><xsl:value-of select="position()"/></td>
                    <td>
                      <xsl:variable name="itemLoc">
                        <xsl:value-of select="sitemap:loc"/>
                      </xsl:variable>
                      <a href="{$itemLoc}" target="_blank">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td>
                      <span class="priority-tag"><xsl:value-of select="sitemap:priority"/></span>
                    </td>
                    <td>
                      <span class="freq-tag"><xsl:value-of select="sitemap:changefreq"/></span>
                    </td>
                    <td style="color: #64748b; font-size: 12px;">
                      <xsl:value-of select="sitemap:lastmod"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
          <div class="footer">
            Generated dynamically by TGSTechInfo Automated Content Pipeline • Standard Sitemaps.org format
          </div>
        </div>
        <script type="text/javascript">
          function filterSitemap() {
            var input = document.getElementById("sitemapSearch");
            var filter = input.value.toLowerCase();
            var table = document.getElementById("sitemapTable");
            var tr = table.getElementsByTagName("tr");
            for (var i = 1; i &lt; tr.length; i++) {
              var td = tr[i].getElementsByTagName("td")[1];
              if (td) {
                var txt = td.textContent || td.innerText;
                tr[i].style.display = txt.toLowerCase().indexOf(filter) &gt; -1 ? "" : "none";
              }
            }
          }
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

