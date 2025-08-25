# Terraform: nginx-config.tf
resource "local_file" "nginx_config" {
  content = templatefile("${path.module}/templates/nginx.conf.tpl", {
    domain_name = var.domain_name
    s3_bucket   = var.s3_bucket_name
    aws_region  = var.aws_region
  })
  filename = "/etc/nginx/sites-available/${var.domain_name}"
}

resource "null_resource" "nginx_reload" {
  depends_on = [local_file.nginx_config]

  provisioner "remote-exec" {
    inline = [
      "sudo nginx -t",
      "sudo nginx -s reload"
    ]

    connection {
      type = "ssh"
      host = var.server_ip
      user = var.ssh_user
    }
  }
}
