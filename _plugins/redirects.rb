module Jekyll

  class Redirects < Generator

    safe true
    priority :low

    def generate(site)    
      site.pages.select{|x| x.data.key? 'redirects' }.each do |p|
        p.data['redirects'].each do |r| 
          redirect = RedirectPage.new(site, site.source, r, p.url)
          redirect.render(site.layouts, site.site_payload)
          redirect.write(site.dest)
          site.pages << redirect
        end
      end
    end
  end

  class RedirectPage < Page

    def initialize(site, base, path, destination)

      @site = site
      @base = base
      @dir  = path
      @name = 'index.html'
      self.process(@name)

      self.read_yaml(File.join(base, '_layouts'), 'redirect.html')
      self.data['source_url'] = destination

    end
  end
end
